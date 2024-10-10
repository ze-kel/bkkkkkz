import { debounce as _debounce } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';

import type { IOpenedPath, IOpenedTag } from '~/api/openedTabs';
import { getFilesByPath, getFilesByTag, type IBookFromDb } from '~/api/watcher/metaCache';
import { useApiEventListener } from '~/api/events';

export const useFilesList = (
  opened: IOpenedPath | IOpenedTag,
  onLoaded?: () => void | Promise<void>,
) => {
  const files = ref<IBookFromDb[]>([]);

  const loading = ref(true);

  const loadContent = async () => {
    loading.value = true;
    if (opened.type === 'folder') {
      files.value = await getFilesByPath(opened.thing);
    }
    if (opened.type === 'tag') {
      files.value = await getFilesByTag(opened.thing);
    }

    nextTick(() => {
      loading.value = false;
      if (onLoaded) {
        onLoaded();
      }
    });
  };

  loadContent();

  //
  // Update event handling
  //
  const updateHandlerApi = ({ file, path }: { file: IBookFromDb; path: string }) => {
    const index = files.value.findIndex((v) => v.path === file.path);
    if (index >= 0) {
      files.value[index] = file;
      triggerRef(files);
    }
  };

  const addHandlerApi = ({ file }: { file: IBookFromDb; path: string }) => {
    files.value.push(file);
    triggerRef(files);
  };

  const removeHandlerApi = ({ path }: { path: string }) => {
    const index = files.value.findIndex((v) => v.path === path);

    if (index >= 0) {
      files.value.splice(index, 1);
      files.value = files.value;
      triggerRef(files);
    }
  };

  useApiEventListener('FILE_ADD', addHandlerApi);
  useApiEventListener('FILE_UPDATE', updateHandlerApi);
  useApiEventListener('FILE_REMOVE', removeHandlerApi);

  return { files, loading };
};
