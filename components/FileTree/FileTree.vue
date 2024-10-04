<template>
  <FileTreeInner v-if="store.folderTree" :content="store.folderTree" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { onMounted } from 'vue';
import { apiEventsEmitter } from '~/api/events';
import { getFileTree } from '~/api/files';
import { useStore } from '~~/utils/store';

const store = useStore();

watch(
  () => store.rootPath,
  async (v) => {
    if (!v) {
      return;
    }
    const tree = await getFileTree(v);
    store.updateFolderTree(tree);
  },
  { immediate: true },
);

onMounted(async () => {
  apiEventsEmitter.addListener('TREE_UPDATE', store.updateFolderTree);
});

onUnmounted(() => {
  apiEventsEmitter.removeListener('TREE_UPDATE', store.updateFolderTree);
});
</script>
