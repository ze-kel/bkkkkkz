<template>
  <div
    class="h-full max-h-full flex overflow-hidden bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
  >
    <div class="flex-auto px-2 box-border" :style="{ width: `${fileTreeSize}px` }">
      <IconsMenu />

      <div class="overflow-y-auto overflow-x-hidden">
        <FileTree />

        <hr class="hr-default my-3" />
        <TagsTree />
      </div>
    </div>

    <div
      ref="resizeHandle"
      class="w-1 hover:bg-indigo-500 cursor-col-resize transition-colors"
      :class="isResizing && 'bg-indigo-700'"
    ></div>
    <div class="bg-neutral-50 dark:bg-neutral-900 flex w-full max-h-full overflow-hidden">
      <View />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, onBeforeMount } from 'vue';

import { debounce as _debounce } from 'lodash';

import IconsMenu from '/@/components/IconsMenu/IconsMenu.vue';
import FileTree from '/@/components/FileTree/FileTree.vue';
import TagsTree from '/@/components/TagsTree/TagsTree.vue';
import View from '/@/components/ViewPane/AppView.vue';

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

<style>
#app {
  font-family: BlinkMacSystemFont, 'SF PRO DISPLAY', 'Roboto', 'Segoe UI';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  background-color: var(--bg-main);
  color: var(--text-main);
}
</style>
