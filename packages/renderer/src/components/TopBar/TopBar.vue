<template>
  <div class="topBar bg-gray-100 text-gray-400 h-8 flex items-center justify-center">
    <div class="max-w-[66%] truncate">{{ opened }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from '/@/use/store';
import formatHeader from '/@/utils/formatHeader';

const store = useStore();

const opened = computed(() => {
  if (store.activeOpenedIndex === null || !store.settings) return '';
  return formatHeader(store.opened[store.activeOpenedIndex], store.settings.rootPath);
});
</script>

<style scoped>
.topBar {
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
</style>
