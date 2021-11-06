<template>
  <div ref="rootElement" class="root">
    <TopBar />
    <div class="mainContainer">
      <div class=""></div>
      <LeftMenu />
      <div class="sourceSelect">
        <h4 class="header-M filesHeader">Files:</h4>
        <FileTree
          v-if="fileTree"
          :content="fileTree"
          :opened-entity="openedPath"
          :style="{ minWidth: `${fileTreeSize}px`, width: `${fileTreeSize}px` }"
          @select="(entity: IFolderTree) => {
          openedPath = entity.path
        }"
        />
      </div>
      <div ref="resizeHandle" :class="['resizeHandle', isResizing && 'show']"></div>
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
import LeftMenu from './LeftMenu/LeftMenu.vue';
import TopBar from './TopBar/TopBar.vue';

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

const isResizing = ref<boolean>(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changeFileTreeSize = (ev: any) => {
  console.log(ev);
  const newVal = ev.clientX;
  if (newVal < 500 && newVal > 150) {
    // 50 is left menu, 14 is sourceSelect padding
    // TODO: make it dynamically calculated
    fileTreeSize.value = ev.clientX - 50 - 14;
  }
};

onMounted(async () => {
  const initial = await api.files.getFileTree();
  fileTree.value = initial;
  api.files.setTreeHandler(updateFolderTreeCallback);

  if (resizeHandle.value) {
    resizeHandle.value.addEventListener('mousedown', () => {
      isResizing.value = true;
      if (rootElement.value) {
        rootElement.value.addEventListener('mousemove', changeFileTreeSize);
        rootElement.value.addEventListener('mouseup', () => {
          isResizing.value = false;
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
  flex-direction: column;
}

.mainContainer {
  display: flex;
  overflow: hidden;
  height: calc(100vh - var(--top-bar-size));
}

.sourceSelect {
  padding: 0 7px;
  box-sizing: border-box;

  background-color: var(--bg-tertiary);

  .filesHeader {
    margin-top: 20px;
    margin-bottom: 10px;
  }
}

.resizeHandle {
  width: 7px;
  background: transparent;
  cursor: col-resize;

  &.show {
    background: greenyellow;
  }
  &:hover {
    background: greenyellow;
  }
}
</style>
