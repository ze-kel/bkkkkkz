<template>
  <div
    class="topBar flex h-8 items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
  >
    <div class="max-w-[66%] truncate">{{ openedText }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from '/@/use/store';
import formatHeader from '/@/utils/formatHeader';

const store = useStore();

const openedText = computed(() => {
  if (!store.openedItem || !store.rootPath) return '';
  return formatHeader(store.openedItem, store.rootPath);
});
</script>

<style scoped>
.topBar {
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
</style>
