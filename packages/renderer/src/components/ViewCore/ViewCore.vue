<template>
  <div class="customCols grid h-full max-h-full items-start overflow-hidden">
    <!-- Empty space to drag window around -->
    <div class="dragApp col-span-2 h-10 bg-neutral-200 dark:bg-neutral-900"></div>

    <!-- Tabs -->
    <TabsSelector class="bg-neutral-200 dark:bg-neutral-900" />

    <!-- Left menu -->
    <div
      class="box-border flex-auto shrink-0 overflow-hidden pl-2"
      :style="{ width: `${fileTreeSize}px` }"
    >
      <div class="z-2 h-full">
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

    <!-- Resizer -->
    <div ref="resizeHandle" class="flex h-full w-3 cursor-col-resize items-center justify-center">
      <div
        class="box-border h-full transition-all"
        :class="isResizing ? 'w-1 dark:bg-neutral-700' : 'w-[1px]  dark:bg-neutral-900'"
      ></div>
    </div>

    <!-- Core view -->
    <div class="flex h-[calc(100%_-_40px)] max-h-full w-full overflow-hidden">
      <div class="flex h-full w-full flex-col">
        <div v-if="store.openedItem" :key="store.openedItem.id" class="h-full w-full">
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

        <NoTabPlaceholder v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, onBeforeMount } from 'vue';

import { debounce as _debounce } from 'lodash';

import IconsMenu from '/@/components/IconsMenu/IconsMenu.vue';
import FileTree from '/@/components/FileTree/FileTree.vue';
import TagsTree from '/@/components/FileTree/TagsTree.vue';
import HomePage from '/@/components/HomePage/HomePage.vue';
import BookEditor from '/@/components/Editor/BookEditor.vue';
import BookView from '/@/components/BookView/BooksView.vue';
import TabsSelector from './TabsSelector.vue';
import { useStore } from '/@/use/store';
import NoTabPlaceholder from '/@/components/Placeholders/NoTabPlaceholder.vue';

const store = useStore();

const fileTreeSize = ref<number>(200);

const resizeHandle = ref<HTMLDivElement | null>(null);

const isResizing = ref<boolean>(false);
const startResizeAt = ref<number>(0);
const changeFileTreeSize = (e: MouseEvent) => {
  console.log('changesize');
  e.preventDefault();
  const newVal = fileTreeSize.value + e.screenX - startResizeAt.value;
  if (newVal < 500 && newVal > 150) {
    fileTreeSize.value = e.clientX;
  }
};

onMounted(async () => {
  if (!resizeHandle.value) return;
  resizeHandle.value.addEventListener('mousedown', (e) => {
    startResizeAt.value = e.screenX;
    isResizing.value = true;
    window.addEventListener('mousemove', changeFileTreeSize);
    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', changeFileTreeSize);
      startResizeAt.value = 0;
      isResizing.value = false;
    });
  });
});
</script>

<style scoped>
.customCols {
  grid-template-columns: min-content min-content 1fr;
  grid-template-rows: min-content 100%;
}
</style>
