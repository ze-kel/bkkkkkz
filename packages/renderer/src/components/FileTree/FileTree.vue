<template>
  <FileTreeInner v-if="store.folderTree" :content="store.folderTree" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { trpcApi } from '/@/utils/trpc';
import { onMounted, onUnmounted } from 'vue';
import type { Unsubscribable } from '@trpc/server/observable';
import { useStore } from '/@/use/store';

const store = useStore();

const toUnsub: Unsubscribable[] = [];

onMounted(async () => {
  const tree = await trpcApi.getFileTree.query();
  store.updateFolderTree(tree);
  const s1 = trpcApi.treeUpdate.subscribe(undefined, { onData: store.updateFolderTree });
  toUnsub.push(s1);
});

onUnmounted(async () => {
  toUnsub.forEach((s) => s.unsubscribe());
});
</script>
