<template>
  <div class="root">
    <div class="treeContainer">
      <FileTree v-if="files" :content="files" @fileSelected="loadFileContent" />
    </div>
    <div class="textContainer">
      <template v-if="currentFileContent">
        <textarea v-model="currentFileContent" class="textInput" />
        <button @click="saveFileContent()">Save</button>
      </template>
      <div v-else>No file Loaded</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileTree from './FileTree/FileTree.vue';
import { useElectron } from '/@/use/electron';
import type { IFile, IFolder } from '/@main/services/files';
const api = useElectron();

const files = ref<IFolder>();
const refreshFiles = async () => {
  const result = await api.files.getFilesFromFolder();
  files.value = result;
};

const currentFileContent = ref<string | null>(null);
const currentFile = ref<IFile | null>(null);

const loadFileContent = async (file: IFile) => {
  currentFile.value = file;
  const fileContent = await api.files.getFileContent(file.path);
  currentFileContent.value = fileContent;
};

const saveFileContent = async () => {
  if (!currentFile.value || !currentFileContent.value) {
    throw 'Trying to save data while having no current file or value';
  }
  await api.files.saveFileContent(currentFile.value.path, currentFileContent.value);
};

refreshFiles();

const updateFolderTreeCallback = (_: Event, newFolder: IFolder) => {
  console.log('got update from chokidar');
  files.value = newFolder;
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
  justify-content: center;
  align-items: center;
}

.textInput {
  width: 100%;
  height: 100%;
}
</style>
