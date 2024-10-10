<template>
  <ShDialog v-model:open="newFileOpened">
    <ShDialogTrigger>
      <slot />
    </ShDialogTrigger>

    <ShDialogContent>
      <ShDialogTitle> Create new file </ShDialogTitle>
      <UiBasicInput
        @keyup.enter="addBook"
        autofocus
        v-model:model-value="newFileName"
        placeholder="Filename"
      ></UiBasicInput>

      <div class="max-w-96 text-xs opacity-50">Saving to: {{ folderToSaveDisplay }}</div>
      <ShButton variant="outline" size="default" @click="addBook"> Create </ShButton>
    </ShDialogContent>
  </ShDialog>
</template>

<script lang="ts" setup>
import path from 'path-browserify';
import { toast } from 'vue-sonner';
import { exists, writeTextFile } from '@tauri-apps/plugin-fs';

const store = useStore();

const newFileOpened = ref(false);
const newFileName = ref('');

const actualFilename = computed(() => {
  return newFileName.value.endsWith('.md') ? newFileName.value : newFileName.value + '.md';
});

const folderToSave = computed(() => {
  if (!store.openedItem || store.openedItem.thing !== 'folder') {
    if (!store.rootPath) throw new Error('No root path');
    return store.rootPath;
  }
  return store.openedItem.thing;
});

const folderToSaveDisplay = computed(() => {
  return path.join(folderToSave.value, actualFilename.value);
});

const addBook = async () => {
  if (!newFileName.value.length) {
    toast.error('Please enter a non empty file name');
    return;
  }

  const finalPath = await path.join(folderToSave.value, actualFilename.value);

  const ex = await exists(finalPath);
  if (ex) {
    toast.error('File with this name already exists');
    return;
  }

  await writeTextFile(finalPath, '');

  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'file',
      thing: finalPath,
      scrollPosition: 0,
    },
    { place: 'last', focus: true },
  );
  newFileOpened.value = false;
};
</script>
