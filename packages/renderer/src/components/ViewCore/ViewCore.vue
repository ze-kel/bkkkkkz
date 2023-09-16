<template>
  <div class="h-full max-h-full flex overflow-hidden">
    <div class="flex-auto box-border" :style="{ width: `${fileTreeSize}px` }">
      <div class="h-10 bg-neutral-200 dark:bg-neutral-900 dragApp"></div>
      <div class="px-2">
        <IconsMenu />

        <div class="overflow-y-auto overflow-x-hidden">
          <FileTree />

          <hr class="bg-neutral-200 dark:bg-neutral-700 h-[1px] border-0 w-full my-3" />
          <TagsTree />
        </div>
      </div>
    </div>

    <div class="flex w-full max-h-full overflow-hidden">
      <div class="w-full h-full flex flex-col">
        <TabsSelector />
        <div
          v-if="store.openedItem"
          :key="store.openedItem.thing"
          class="w-full h-[calc(100%_-_40px)]"
        >
          <template v-if="store.openedItem.type === 'innerPage'">
            <HomePage v-if="store.openedItem.thing === 'home'" />
          </template>
          <template v-else>
            <BookEditor
              v-if="store.openedItem.type === 'file' || store.openedItem.type === 'newFile'"
              :opened="store.openedItem" />
            <BookView v-else :opened="store.openedItem" :index="store.openedTabsActiveIndex || 0"
          /></template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, onBeforeMount } from 'vue';

import { debounce as _debounce } from 'lodash';

import IconsMenu from '/@/components/IconsMenu/IconsMenu.vue';
import FileTree from '/@/components/FileTree/FileTree.vue';
import TagsTree from '/@/components/TagsTree/TagsTree.vue';
import HomePage from '/@/components/HomePage/HomePage.vue';
import BookEditor from '/@/components/Editor/BookEditor.vue';
import BookView from '/@/components/BookView/BookView.vue';
import TabsSelector from './TabsSelector.vue';
import { useStore } from '/@/use/store';

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
