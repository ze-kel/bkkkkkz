<template>
  <div v-if="store.opened.length && store.settings" class="w-full h-full flex flex-col">
    <div class="flex bg-gray-100 text-gray-400 cursor-pointer h-[32px]">
      <div
        v-for="(item, index) in store.opened"
        :key="index"
        class="px-2 py-1 max-w-[200px] flex items-center"
        :class="index === store.activeOpenedIndex && ['bg-white text-gray-900']"
        @click="store.setOpenedIndex(index)"
      >
        <div class="truncate">{{ formatHeader(item, store.settings.rootPath) }}</div>

        <div
          class="hover:bg-gray-800 rounded flex items-center h-4 ml-1 transition-colors"
          @click="store.closeOpened(index)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            :class="[
              index === store.activeOpenedIndex ? 'fill-gray-500' : 'fill-gray-300',
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
    </div>
    <div
      v-if="opened && store.activeOpenedIndex !== null"
      class="w-full h-[calc(100%_-_32px)] mt-2"
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
import { computed } from 'vue';
import BookView from '/@/components/BookView/BookView.vue';
import Editor from '../Editor/Editor.vue';
import formatHeader from '/@/utils/formatHeader';

const store = useStore();

const opened = computed(() => {
  if (store.activeOpenedIndex === null) return null;
  return store.opened[store.activeOpenedIndex];
});
</script>
