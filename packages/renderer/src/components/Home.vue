<template>
  <div ref="rootElement" class="bg-gray-100 h-screen flex flex-col">
    <TopBar />
    <ContextMenu />
    <div v-if="!gotFileTreePath" class="fullScreen">
      <Welcome @set-path="newRootPath" />
    </div>
    <div v-if="gotFileTreePath" class="h-full max-h-full flex overflow-hidden">
      <div class="flex flex-col-reverse">
        <LeftMenu @change-root-path="init" />
      </div>
      <div class="flex-auto py-6 px-2">
        <FileTree
          v-if="fileTree"
          :content="fileTree"
          :opened-entity="opened"
          :style="{ width: `${fileTreeSize}px` }"
          @select="newOpened"
        />

        <hr class="hr-default my-3" />
        <Tags :opened="opened" @select="newOpened" />
      </div>
      <div class="bg-white flex w-full max-h-full rounded-tl-lg overflow-hidden">
        <div
          ref="resizeHandle"
          class="w-1 hover:bg-indigo-500 cursor-col-resize transition-colors"
          :class="isResizing && 'bg-indigo-700'"
        ></div>
        <BookView v-if="opened" :opened-thing="opened" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch, watchEffect } from 'vue';
import { useElectron } from '/@/use/electron';
import useSettings from '/@/use/settings';

import type { IFolderTree } from '/@main/services/files';
import type { IOpened } from '/@main/services/watcher';

import _debounce from 'lodash-es/debounce';

import BookView from './BookView/BookView.vue';
import LeftMenu from './LeftMenu/LeftMenu.vue';
import TopBar from './TopBar/TopBar.vue';
import FileTree from './FileTree/FileTree.vue';
import Welcome from './WelcomeScreen/Welcome.vue';
import ContextMenu from './_UI/ContextMenu.vue';
import Tags from './TagsTree/Tags.vue';

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
    await useSettings.initSettings();
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

<style scoped></style>
