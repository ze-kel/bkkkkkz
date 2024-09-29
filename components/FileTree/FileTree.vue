<template>
  <FileTreeInner v-if="store.folderTree" :content="store.folderTree" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { onMounted } from 'vue';
import { getFileTree } from '~/api/files';
import { useStore } from '~~/utils/store';

const store = useStore();

onMounted(async () => {
  if (!store.rootPath) return;
  const tree = await getFileTree(store.rootPath);
  store.updateFolderTree(tree);
});
</script>
