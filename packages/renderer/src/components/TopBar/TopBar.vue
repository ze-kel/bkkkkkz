<template>
  <div
    class="topBar bg-neutral-100 dark:bg-neutral-800 text-neutral-400 h-8 flex items-center justify-center"
  >
    <div class="max-w-[66%] truncate">{{ openedText }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRootPath } from '/@/use/rootPath';
import { useStore } from '/@/use/store';
import formatHeader from '/@/utils/formatHeader';

const { rootPath } = useRootPath();
const store = useStore();

const openedText = computed(() => {
  if (!store.openedItem || !rootPath.value) return '';
  return formatHeader(store.openedItem, rootPath.value);
});
</script>

<style scoped>
.topBar {
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
</style>
