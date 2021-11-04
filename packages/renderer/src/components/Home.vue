<template>
  <div ref="rootElement" class="root">
    <div
      class="treeContainer"
      :style="{ minWidth: `${fileTreeSize}px`, width: `${fileTreeSize}px` }"
    >
      <FileTree
        v-if="fileTree"
        :content="fileTree"
        :opened-entity="openedPath"
        @select="(entity: IFolderTree) => {
          openedPath = entity.path
        }"
      />
    </div>
    <div ref="resizeHandle" class="resizeHandle"></div>
    <div class="editorContainer">
      <Editor v-if="openedPath" :opened-path="openedPath" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch, watchEffect } from 'vue';
import FileTree from './FileTree/FileTree.vue';
import { useElectron } from '/@/use/electron';
import type { IFolderTree } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';
import Editor from './Editor/Editor.vue';

const api = useElectron();
const internalInstance = getCurrentInstance();

const fileTree = ref<IFolderTree>();

const openedPath = ref<IFolderTree['path'] | null>(null);

const updateFolderTreeCallback = (_: Event, newFolder: IFolderTree) => {
  fileTree.value = newFolder;
};

const fileTreeSize = ref<number>(200);

const resizeHandle = ref<Element | null>(null);
const rootElement = ref<Element | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changeFileTreeSize = (ev: any) => {
  const newVal = ev.clientX;
  if (newVal < 500 && newVal > 150) {
    fileTreeSize.value = ev.clientX;
  }
};

onMounted(async () => {
  const initial = await api.files.getFileTree();
  fileTree.value = initial;
  api.files.setTreeHandler(updateFolderTreeCallback);

  if (resizeHandle.value) {
    resizeHandle.value.addEventListener('mousedown', () => {
      if (rootElement.value) {
        rootElement.value.addEventListener('mousemove', changeFileTreeSize);
        rootElement.value.addEventListener('mouseup', () => {
          if (rootElement.value) {
            rootElement.value.removeEventListener('mousemove', changeFileTreeSize);
          }
        });
      }
    });
  }
});
</script>

<style lang="scss" scoped>
.root {
  display: flex;
  height: 100vh;
}

.treeContainer {
  overflow-y: scroll;
  height: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.resizeHandle {
  width: 7px;
  background: transparent;
  cursor: col-resize;
  &:hover {
    background: greenyellow;
  }
}

.editorContainer {
  overflow-y: scroll;
  width: 100%;
  height: fit-content;
}

.textInput {
  width: 100%;
  height: 100%;
}
</style>
