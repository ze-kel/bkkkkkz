<template>
  <ShDialog v-model:open="newFileOpened">
    <ShDialogTrigger>
      <slot />
    </ShDialogTrigger>

    <ShDialogContent>
      <ShDialogTitle> Create new file </ShDialogTitle>
      <UiBasicInput
        v-on-key-stroke:Enter="addBook"
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
import * as path from '@tauri-apps/api/path';
import { computedAsync } from '@vueuse/core';
import { vOnKeyStroke } from '@vueuse/components';
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

// Path join call rust, avoid call on each keystroke by computing with mock
const folderToSaveStub = computedAsync(async () => {
  return await path.join(folderToSave.value, '<|>');
}, '<|>');

const folderToSaveDisplay = computed(() => {
  return folderToSaveStub.value.replace('<|>', actualFilename.value);
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
