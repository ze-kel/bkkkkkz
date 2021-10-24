<template>
  <div class="root">
    <div class="treeContainer">
      <FileTree
        v-if="files"
        :content="files"
        :opened-file="currentFile"
        @fileSelected="loadFileContentChoki"
      />
    </div>
    <div class="textContainer">
      <div v-if="currentFile">{{ currentFile.path }}</div>
      <template v-if="currentFileContent != null">
        <textarea v-model="currentFileContent" class="textInput" />
      </template>
      <div v-else>No file Loaded</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import FileTree from './FileTree/FileTree.vue';
import { useElectron } from '/@/use/electron';
import type { IFile, IFolder } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

const api = useElectron();

const files = ref<IFolder>();

const currentFileContent = ref<string | null>(null);
const currentFile = ref<IFile | null>(null);
const isChangingFile = ref<boolean>(false);

const updateFileContentCallback = (_: Event, newContent: string) => {
  currentFileContent.value = newContent;
};

const loadFileContentChoki = async (file: IFile) => {
  isChangingFile.value = true;
  currentFile.value = file;
  currentFileContent.value = null;
  await api.files.watchFile(updateFileContentCallback, file.path);
  isChangingFile.value = false;
};

const debouncedSave = _debounce(api.files.saveFileContent, 1000);

watchEffect(() => {
  if (isChangingFile.value || !currentFile.value || currentFileContent.value === null) {
    console.log('save triggered but we are ignoring it');
    return;
  }
  console.log('save');
  debouncedSave(currentFile.value.path, currentFileContent.value);
});

const updateFolderTreeCallback = (_: Event, newFolder: IFolder) => {
  console.log('got update from chokidar');
  files.value = newFolder;

  // Cheking whether the currently opened file was deleted
  const filePath = currentFile.value?.path.split('/');
  console.log(filePath);

};
api.files.watchFolder(updateFolderTreeCallback);
</script>

<style scoped>
.root {
  display: flex;
}

.treeContainer {
  width: 50%;
}

.textContainer {
  width: 100%;
  padding: 0 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.textInput {
  width: 100%;
  height: 100%;
}
</style>
