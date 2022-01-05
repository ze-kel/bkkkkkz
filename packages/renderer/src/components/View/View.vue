<template>
  <div v-if="store.opened.length && store.settings" class="w-full h-full">
    <div class="flex bg-gray-100 text-gray-400 cursor-pointer">
      <div
        v-for="(item, index) in store.opened"
        :key="index"
        class="px-2 py-1 max-w-[200px] truncate"
        :class="index === store.activeOpenedIndex && ['bg-white text-gray-900']"
        @click="store.setOpenedIndex(index)"
      >
        {{ formatHeader(item, store.settings.rootPath) }}
      </div>
    </div>
    <div v-if="opened && store.activeOpenedIndex !== null" class="w-full h-full pt-2">
      <Editor v-if="opened.type === 'file'" :opened="opened" :index="store.activeOpenedIndex" />
      <BookView v-else :opened="opened" :index="store.activeOpenedIndex" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import Tab from './Tab.vue';
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
