<template>
  <div ref="rootElement" class="root">
    <TopBar />
    <div v-if="!gotFileTreePath" class="fullScreen">
      <Welcome @set-path="newRootPath" />
    </div>
    <div v-if="gotFileTreePath" class="mainContainer">
      <LeftMenu @change-root-path="init" />
      <div class="sourceSelect">
        <FileTree
          v-if="fileTree"
          :content="fileTree"
          :opened-entity="openedPath"
          :style="{ minWidth: `${fileTreeSize}px`, width: `${fileTreeSize}px` }"
          @select="(entity: IFolderTree, recursive: boolean) => {
          openedPath = entity.path
          recursivePathLoading = recursive
        }"
        />
      </div>
      <div ref="resizeHandle" :class="['resizeHandle', isResizing && 'show']"></div>
      <Editor v-if="openedPath" :opened-path="openedPath" :recursive="recursivePathLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch, watchEffect } from 'vue';
import { useElectron } from '/@/use/electron';

import type { IFolderTree } from '/@main/services/files';

import _debounce from 'lodash-es/debounce';

import Editor from './Editor/Editor.vue';
import LeftMenu from './LeftMenu/LeftMenu.vue';
import TopBar from './TopBar/TopBar.vue';
import FileTree from './FileTree/FileTree.vue';
import Welcome from './WelcomeScreen/Welcome.vue';
import ContextMenu from './_UI/ContextMenu.vue';

const api = useElectron();
const internalInstance = getCurrentInstance();

const gotFileTreePath = ref<boolean>(true);
const fileTree = ref<IFolderTree>();

const openedPath = ref<IFolderTree['path'] | null>(null);
const recursivePathLoading = ref(false);

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

const init = async () => {
  const allGood = await api.core.init();
  if (allGood) {
    const initial = await api.files.getFileTree();
    fileTree.value = initial;
    gotFileTreePath.value = true;
  } else {
    gotFileTreePath.value = false;
  }
};

const newRootPath = async () => {
  const allGood = await api.settings.newRootPath();
  if (allGood) {
    init();
  }
};

onMounted(async () => {
  await init();

  api.files.setTreeHandler(updateFolderTreeCallback);

  resizeHandle.value?.addEventListener('mousedown', () => {
    isResizing.value = true;
    rootElement.value?.addEventListener('mousemove', changeFileTreeSize);
    rootElement.value?.addEventListener('mouseup', () => {
      isResizing.value = false;
      rootElement.value?.removeEventListener('mousemove', changeFileTreeSize);
    });
  });
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
  padding: 25px 7px;
  box-sizing: border-box;

  background-color: var(--bg-secondary);

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
    background: var(--accent-main-grad);
  }
  &:hover {
    background: var(--accent-main-grad);
  }
}

.fullScreen {
  width: 100%;
  height: calc(100% - var(--top-bar-size));
  position: absolute;
  top: var(--top-bar-size);
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
}
</style>
