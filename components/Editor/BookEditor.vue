<template>
  <div v-if="!loading" class="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
    <div class="mx-auto w-full max-w-2xl">
      <div class="h-full min-h-[200px] border-t border-neutral-300 py-4 dark:border-neutral-800">
        <Editor2
          ref="markdown"
          :initial-value="openedFile.content"
          @change="
            () => {
              unsavedMarkdownChanges++;
              debouncedSave();
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep as _cloneDeep } from 'lodash';
import { debounce as _debounce } from 'lodash';

import type { PropType } from 'vue';
import {
  fetchCover,
  getFileContent,
  removeCover,
  renameEntity,
  saveFileContent,
  setCover,
  type IFile,
  type ISavedFile,
} from '~/api/files';
import type { IOpenedFile } from '~/api/openedTabs';
import { useStore } from '~~/utils/store';

import { toast } from 'vue-sonner';
import type { EditorView } from '@codemirror/view';

const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile>,
    required: true,
  },
});

const openedFile = ref<ISavedFile>({ name: '', path: '' });
const previousName = ref('');
const loading = ref(true);

const markdownRef = useTemplateRef('markdown');


const unsavedMarkdownChanges = ref(0);

const save = async () => {
  const file = openedFile.value;
  if (!file.path || !file.name) return;
  let sc = 0;
  if (markdownRef.value && markdownRef.value.$.exposed) {
    const { editor } = markdownRef.value.$.exposed as { editor: Ref<EditorView | null> };

    if (editor.value) {
      file.content = editor.value?.state.doc.toString();
      sc = unsavedMarkdownChanges.value;
    }
  }

  await saveFileContent(file);
  unsavedMarkdownChanges.value = unsavedMarkdownChanges.value - sc;
};

const rename = async (newName: string) => {
  if (!openedFile.value.path) return;
  const newPath = await renameEntity({ srcPath: openedFile.value.path, newName });
  store.openNewOne({ ...props.opened, thing: newPath }, { place: 'current' });
};

const debouncedSave = _debounce(save, 500);
const debouncedRename = _debounce(rename, 500);

onBeforeUnmount(async () => {
  debouncedRename.cancel();
  if (unsavedMarkdownChanges.value > 0) {
    debouncedSave();
  }
  debouncedSave.flush();
});

watch(
  openedFile,
  (newFile, oldFile) => {
    if (!oldFile || !newFile || loading.value) return;

    // Can't check against oldFile because after mutation it will be the same
    // OldFile is still useful to eliminate initial load case
    if (newFile.name && newFile.name !== previousName.value) {
      debouncedRename(newFile.name);
    } else {
      debouncedSave();
    }
  },
  { deep: true },
);
</script>

<style scoped>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}
</style>
