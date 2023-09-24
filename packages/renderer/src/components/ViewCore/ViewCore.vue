<template>
  <div class="flex h-full max-h-full overflow-hidden">
    <div class="box-border flex-auto overflow-hidden" :style="{ width: `${fileTreeSize}px` }">
      <div class="dragApp h-10 bg-neutral-200 dark:bg-neutral-900"></div>
      <div class="z-2 h-full border-r border-neutral-100 px-2 dark:border-neutral-900">
        <IconsMenu />

        <div class="overflow-y-auto overflow-x-hidden">
          <FileTree />

          <hr
            class="dark:bg-neutral-000 my-3 h-[1px] w-full border-0 bg-neutral-100 dark:bg-neutral-900"
          />
          <TagsTree />
        </div>
      </div>
    </div>

    <div class="flex max-h-full w-full overflow-hidden">
      <div class="flex h-full w-full flex-col">
        <TabsSelector class="bg-neutral-200 dark:bg-neutral-900" />
        <div
          v-if="store.openedItem"
          :key="store.openedItem.thing"
          class="h-[calc(100%_-_40px)] w-full"
        >
          <template v-if="store.openedItem.type === 'innerPage'">
            <HomePage v-if="store.openedItem.thing === 'home'" />
          </template>
          <template v-else>
            <BookEditor
              v-if="store.openedItem.type === 'file' || store.openedItem.type === 'newFile'"
              :opened="store.openedItem"
            />
            <BookView v-else :opened="store.openedItem" :index="store.openedTabsActiveIndex || 0" />
          </template>
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
import BookView from '/@/components/BookView/BooksView.vue';
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

<style></style>
