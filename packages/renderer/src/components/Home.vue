<template>
  <div class="root">
    <div class="treeContainer">
      <FileTree
        v-if="files"
        :content="files"
        :opened-entity="openedEntity"
        @select="(entity: IFile | IFolder) => {
          openedEntity = entity
        }"
      />
    </div>
    <div class="editorContainer">
      <Editor :opened-files="openedFiles" class="textContainer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import FileTree from './FileTree/FileTree.vue';
import { useElectron } from '/@/use/electron';
import type { IFile, IFolder } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';
import Editor from './Editor/Editor.vue';
import filesRouter from '../use/filesRouter';

const api = useElectron();

const files = ref<IFolder>();

const openedEntity = ref<IFile | IFolder | null>(null);
const openedFiles = computed(() => {
  if (!openedEntity.value) return [];
  if (openedEntity.value.type === 'file') return [openedEntity.value];
  const entries = Object.entries(openedEntity.value.content);
  const files: IFile[] = [];
  entries.forEach((el) => {
    if (el[1].type === 'file') {
      files.push(el[1]);
    }
  });
  return files;
});

const updateFolderTreeCallback = (_: Event, newFolder: IFolder) => {
  console.log('got update from chokidar');
  files.value = newFolder;
};
api.files.initWatcher(updateFolderTreeCallback);
filesRouter.init();
</script>

<style lang="scss" scoped>
.root {
  display: flex;
  height: 100vh;
}

.treeContainer {
  width: 50%;
  overflow-y: scroll;
  height: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.textContainer {
  width: 100%;
  box-sizing: border-box;
  padding: 0 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.editorContainer {
  overflow-y: scroll;
  width: 100%;
  height: 100%;
}

.textInput {
  width: 100%;
  height: 100%;
}
</style>
