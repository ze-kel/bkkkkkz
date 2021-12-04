<template>
  <div ref="rootElement" class="root">
    <TopBar />
    <ContextMenu />
    <div v-if="!gotFileTreePath" class="fullScreen">
      <Welcome @set-path="newRootPath" />
    </div>
    <div v-if="gotFileTreePath" class="mainContainer">
      <div class="leftMenuContainer">
        <LeftMenu @change-root-path="init" />
      </div>
      <div class="sourceSelectContainer">
        <FileTree
          v-if="fileTree"
          :content="fileTree"
          :opened="opened"
          :style="{ width: `${fileTreeSize}px` }"
          @select="newOpened"
        />
        <Tags :opened="opened" @select="newOpened" />
      </div>
      <div class="editorContainer">
        <div ref="resizeHandle" :class="['resizeHandle', isResizing && 'show']"></div>
        <BookView v-if="opened" :opened-thing="opened" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch, watchEffect } from 'vue';
import { useElectron } from '/@/use/electron';

import type { IFolderTree } from '/@main/services/files';
import type { IOpened } from '/@main/services/watcher';

import _debounce from 'lodash-es/debounce';

import BookView from './BookView/BookView.vue';
import LeftMenu from './LeftMenu/LeftMenu.vue';
import TopBar from './TopBar/TopBar.vue';
import FileTree from './FileTree/FileTree.vue';
import Welcome from './WelcomeScreen/Welcome.vue';
import ContextMenu from './_UI/ContextMenu.vue';
import Tags from './Tags/Tags.vue';

const api = useElectron();
const internalInstance = getCurrentInstance();

const gotFileTreePath = ref<boolean>(true);
const fileTree = ref<IFolderTree>();

const opened = ref<IOpened | null>(null);
const newOpened = (newOne: IOpened) => {
  opened.value = newOne;
};

const updateFolderTreeCallback = (newFolder: IFolderTree) => {
  fileTree.value = newFolder;
};

const fileTreeSize = ref<number>(200);

const resizeHandle = ref<Element | null>(null);
const rootElement = ref<Element | null>(null);

const isResizing = ref<boolean>(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changeFileTreeSize = (ev: any) => {
  const newVal = ev.clientX;
  if (newVal < 500 && newVal > 150) {
    // 40 is left menu, 14 is sourceSelect padding, 3 is half the size of resize handle
    // TODO: make it dynamically calculated
    fileTreeSize.value = ev.clientX - 40 - 14 - 3;
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

  api.subscriptions.TREE_UPDATE(updateFolderTreeCallback);

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
  background-color: var(--bg-secondary);
}

.mainContainer {
  display: flex;
  overflow: hidden;
  height: calc(100vh - var(--top-bar-size));
}

.leftMenuContainer {
  display: flex;
  flex-direction: column-reverse;
}

.sourceSelectContainer {
  padding: 25px 7px;
  box-sizing: border-box;

  .filesHeader {
    margin-top: 20px;
    margin-bottom: 7px;
  }
}

.editorContainer {
  display: flex;
  width: 100%;
  border-radius: 10px 0 0 0;
  overflow: hidden;
  background-color: var(--bg-main);
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
