<template>
  <FileTreeInner v-if="data" :content="data" />
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import FileTreeInner from './FileTreeInner.vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { trpcApi } from '/@/utils/trpc';
import type { IFolderTree } from '/@main/services/files';
import { onMounted, onUnmounted } from 'vue';
import type { Unsubscribable } from '@trpc/server/observable';
import { sq } from 'date-fns/locale';

const queryClient = useQueryClient();

const { isLoading, isError, data, error } = useQuery({
  queryFn: async () => {
    return await trpcApi.getFileTree.query();
  },
  queryKey: ['fileTree'],
});

const setData = (data: IFolderTree) => {
  queryClient.setQueryData(['fileTree'], data);
};

const toUnsub: Unsubscribable[] = [];

onMounted(async () => {
  const s1 = trpcApi.treeUpdate.subscribe(undefined, { onData: setData });
  toUnsub.push(s1);
});

onUnmounted(async () => {
  toUnsub.forEach((s) => s.unsubscribe());
});
</script>
