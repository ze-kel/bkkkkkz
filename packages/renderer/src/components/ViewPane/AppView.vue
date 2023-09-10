<template>
  <div v-if="store.opened.tabs?.length" class="w-full h-full flex flex-col">
    <div class="flex bg-neutral-50 dark:bg-neutral-950 h-[32px]">
      <div
        v-for="(item, index) in store.opened.tabs"
        :key="index"
        v-test-class="['T-view-tab', index === store.opened.active && 'T-view-tab-opened']"
        class="px-2 py-1 max-w-[200px] flex items-center transition-colors border-transparent"
        :class="
          index === store.opened.active
            ? ''
            : 'text-neutral-300 dark:text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-900 cursor-pointer'
        "
        @click="store.setOpenedIndex(index)"
      >
        <div v-if="store.rootPath" v-test-class="'T-label'" class="truncate">
          {{ formatHeader(item, store.rootPath) }}
        </div>

        <div
          class="hover:bg-neutral-800 rounded flex items-center h-4 ml-1 transition-colors cursor-pointer"
          @click="store.closeOpened(index)"
        >
          <CrossIcon
            class="w-4"
            :class="[
              index === store.opened.active
                ? 'stroke-neutral-50'
                : 'stroke-neutral-300 dark:stroke-neutral-600',
              'hover:stroke-white',
              'transition-colors',
            ]"
          />
        </div>
      </div>

      <div
        class="w-full"
        :class="canDropHere && 'bg-neutral-200'"
        @drop="onDrop($event)"
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @dragover.prevent
      ></div>
    </div>
    <div
      v-if="store.openedItem && typeof store.opened.active === 'number'"
      :key="store.openedItem.thing + store.opened.active"
      class="w-full h-[calc(100%_-_32px)]"
    >
      <template v-if="store.openedItem.type === 'innerPage'">
        <HomePage v-if="store.openedItem.thing === 'home'" />
      </template>
      <template v-else>
        <Editor
          v-if="store.openedItem.type === 'file' || store.openedItem.type === 'newFile'"
          :opened="store.openedItem"
          :index="store.opened.active" />
        <BookView v-else :opened="store.openedItem" :index="store.opened.active"
      /></template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import BookView from '/@/components/BookView/BookView.vue';
import Editor from '../Editor/BookEditor.vue';
import formatHeader from '/@/utils/formatHeader';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';
import HomePage from '../HomePage/HomePage.vue';
import { useStore } from '/@/use/store';
import CrossIcon from '@heroicons/vue/24/outline/XMarkIcon';

const store = useStore();

//
// Drag & Drop
//
const canDropHere = ref(false);

const dragEnter = (e: DragEvent) => {
  e.preventDefault();
  canDropHere.value = true;
};

const dragLeave = (e: DragEvent) => {
  e.preventDefault();
  canDropHere.value = false;
};

const onDrop = (e: DragEvent) => {
  canDropHere.value = false;

  const type = e.dataTransfer?.getData('type');
  const draggedPath = e.dataTransfer?.getData('itemPath');

  if (type !== 'file' && type !== 'folder') return;
  if (!draggedPath) return;

  store.openNewOne({
    type,
    thing: draggedPath,
    scrollPosition: 0,
    settings: getDefaultViewSettings(),
  });
};
</script>
