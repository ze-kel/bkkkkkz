<template>
  <div v-if="store.opened.length && store.settings" class="w-full h-full flex flex-col">
    <div class="flex bg-neutral-100 dark:bg-neutral-800 h-[32px]">
      <div
        v-for="(item, index) in store.opened"
        :key="index"
        class="px-2 py-1 max-w-[200px] flex items-center transition-colors border-transparent"
        :class="
          index === store.activeOpenedIndex
            ? 'bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50'
            : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer'
        "
        @click="store.setOpenedIndex(index)"
      >
        <div class="truncate">{{ formatHeader(item, store.settings.rootPath) }}</div>

        <div
          class="hover:bg-neutral-800 rounded flex items-center h-4 ml-1 transition-colors"
          @click="store.closeOpened(index)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            :class="[
              index === store.activeOpenedIndex ? 'fill-neutral-500' : 'fill-neutral-300',
              'hover:fill-white',
              'transition-colors',
            ]"
          >
            <path
              d="M17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41L17.59 5Z"
            />
          </svg>
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
      v-if="opened && store.activeOpenedIndex !== null"
      :key="opened.thing + store.activeOpenedIndex"
      class="w-full h-[calc(100%_-_32px)]"
    >
      <Editor
        v-if="opened.type === 'file' || opened.type === 'newFile'"
        :opened="opened"
        :index="store.activeOpenedIndex"
      />
      <BookView v-else :opened="opened" :index="store.activeOpenedIndex" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import { computed, ref } from 'vue';
import BookView from '/@/components/BookView/BookView.vue';
import Editor from '../Editor/Editor.vue';
import formatHeader from '/@/utils/formatHeader';

const store = useStore();

const opened = computed(() => {
  if (store.activeOpenedIndex < 0) return null;
  return store.opened[store.activeOpenedIndex];
});

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
  console.log('droppd');
  canDropHere.value = false;

  const type = e.dataTransfer?.getData('type');
  const draggedPath = e.dataTransfer?.getData('itemPath');

  if (type !== 'file' && type !== 'folder') return;
  if (!draggedPath) return;

  store.addOpened(type, draggedPath);
};
</script>
