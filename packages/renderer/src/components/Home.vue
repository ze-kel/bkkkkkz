<template>
  <div ref="rootElement" class="bg-gray-100 h-screen flex flex-col">
    <TopBar />
    <ContextMenu />
    <Welcome v-if="store.initialSetup" />
    <div v-if="store.initialized" class="h-full max-h-full flex overflow-hidden">
      <div
        class="flex-auto px-2 overflow-y-auto overflow-x-hidden"
        :style="{ width: `${fileTreeSize}px` }"
      >
        <IconsMenu />

        <FileTree />

        <hr class="hr-default my-3" />
        <TagsTree />
      </div>

      <div
        ref="resizeHandle"
        class="w-1 hover:bg-indigo-500 cursor-col-resize transition-colors"
        :class="isResizing && 'bg-indigo-700'"
      ></div>
      <div class="bg-white flex w-full max-h-full border-l border-gray-300 overflow-hidden">
        <View />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref } from 'vue';
import { useStore } from '/@/use/store';

import _debounce from 'lodash-es/debounce';

import IconsMenu from './IconsMenu/IconsMenu.vue';
import TopBar from './TopBar/TopBar.vue';
import FileTree from './FileTree/FileTree.vue';
import Welcome from './WelcomeScreen/Welcome.vue';
import ContextMenu from './_UI/ContextMenu.vue';
import TagsTree from './TagsTree/TagsTree.vue';
import View from './View/View.vue';

const store = useStore();

const fileTreeSize = ref<number>(200);

const resizeHandle = ref<Element | null>(null);
const rootElement = ref<Element | null>(null);

const isResizing = ref<boolean>(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changeFileTreeSize = (ev: any) => {
  const newVal = ev.clientX;
  if (newVal < 500 && newVal > 150) {
    fileTreeSize.value = ev.clientX;
  }
};

onMounted(async () => {
  await store.initCore();

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
