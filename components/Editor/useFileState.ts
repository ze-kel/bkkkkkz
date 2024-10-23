import { invoke } from '@tauri-apps/api/core';
import { throttle } from 'lodash';
import type { ShallowRef } from 'vue';

import type { IOpenedFile } from '~/api/openedTabs';
import { useListenToEvent, type IBookFromDb } from '~/api/tauriEvents';
import { useCodeMirror } from '~/components/Editor/CodeMirror/useCodeMirror';

export const useBookEditor = (
  opened: IOpenedFile,
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>,
) => {
  const file = ref<IBookFromDb | null>(null);

  const file_clean = computed<IBookFromDb | null>(() =>
    file.value ? { ...file.value, markdown: '', modified: '' } : null,
  );

  const error = ref<String | null>(null);

  const { createEditor, getEditorState, changes, updateEditorState } =
    useCodeMirror(editorTemplateRef);

  const loadFileFromDisk = async () => {
    if (opened.type !== 'file') return;
    const res = await invoke('c_read_file_by_path', {
      path: opened.thing,
    });

    if (typeof res === 'string') {
      error.value = res;
      return;
    }

    file.value = res as IBookFromDb;
    updateEditorState(file.value.markdown);
  };

  watchEffect(async () => {
    if (opened.type === 'file') {
      //  throttledSaveFile.flush();
      await loadFileFromDisk();
    } else {
      file.value = null;
    }
  });

  onMounted(() => {
    createEditor(file.value?.markdown || '');
  });

  const updateHandler = async (update: IBookFromDb) => {
    console.log('update handler');
    if (update.modified === file.value?.modified) return;
    await loadFileFromDisk();
  };

  useListenToEvent('file_update', updateHandler);

  const saveFile = async () => {
    if (!file.value) return;

    const changesCopy = changes.value;

    if (changesCopy > 0) {
      file.value.markdown = getEditorState();
    }

    console.log('saving file');

    const r = await invoke('c_save_file', {
      book: { ...file.value },
    });

    if (file.value) {
      file.value.modified = r as string;
    }

    changes.value -= changesCopy;

    if (changes.value < 0) {
      console.error('changes less than zero');
    }
  };

  const throttledSaveFile = throttle(saveFile, 2000, {});

  watch(
    file_clean,
    (newFile, oldFile) => {
      if (!oldFile || !newFile) return;
      console.log('file updated', newFile, oldFile);
      throttledSaveFile();
    },
    { deep: true },
  );

  watch(changes, (newValue, oldValue) => {
    console.log('changes watcher', newValue);
    if (newValue > 0) {
      throttledSaveFile();
    }
  });

  onBeforeUnmount(async () => {
    await throttledSaveFile.flush();
  });

  return { file, error, saveFile };
};
