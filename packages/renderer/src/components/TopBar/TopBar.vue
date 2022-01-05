<template>
  <div class="topBar bg-gray-100 text-gray-700 h-8 flex items-center justify-center">
    <div>{{ opened }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from '/@/use/store';

const store = useStore();

const opened = computed(() => {
  if (store.opened && store.settings) {
    if (store.opened.type === 'path') {
      if (store.opened.thing === store.settings.rootPath) {
        return 'All Books';
      }
      return store.opened.thing.replace(store.settings.rootPath + '/', '');
    }

    if (store.opened.type === 'tag') {
      return '#' + store.opened.thing;
    }
  }
  return '';
});
</script>

<style scoped>
.topBar {
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
</style>
