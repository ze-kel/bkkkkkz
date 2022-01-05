<template>
  <div ref="rootElement" class="bg-gray-100 h-screen flex flex-col">
    <TopBar />
    <ContextMenu />
    <div v-if="!gotFileTreePath" class="fullScreen">
      <Welcome @set-path="store.newRootPath" />
    </div>
    <div v-if="gotFileTreePath" class="h-full max-h-full flex overflow-hidden">
      <div class="flex flex-col-reverse">
        <LeftMenu />
      </div>
      <div class="flex-auto py-6 px-2">
        <FileTree :style="{ width: `${fileTreeSize}px` }" />

        <hr class="hr-default my-3" />
        <TagsTree />
      </div>
      <div class="bg-white flex w-full max-h-full rounded-tl-lg overflow-hidden">
        <div
          ref="resizeHandle"
          class="w-1 hover:bg-indigo-500 cursor-col-resize transition-colors"
          :class="isResizing && 'bg-indigo-700'"
        ></div>
        <BookView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref } from 'vue';
import { useElectron } from '/@/use/electron';

import _debounce from 'lodash-es/debounce';

import BookView from './BookView/BookView.vue';
import LeftMenu from './LeftMenu/LeftMenu.vue';
import TopBar from './TopBar/TopBar.vue';
import FileTree from './FileTree/FileTree.vue';
import Welcome from './WelcomeScreen/Welcome.vue';
import ContextMenu from './_UI/ContextMenu.vue';
import TagsTree from './TagsTree/TagsTree.vue';
import { useStore } from '/@/use/store';

const api = useElectron();
const store = useStore();
const internalInstance = getCurrentInstance();

const gotFileTreePath = ref<boolean>(true);
// const fileTree = ref<IFolderTree>();

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

onMounted(async () => {
  // await init();
  await store.initCore();

  // api.subscriptions.TREE_UPDATE(updateFolderTreeCallback);

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
