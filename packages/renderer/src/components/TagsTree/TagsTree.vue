<template>
  <div v-if="!isLoading && !isError">
    <Tag v-for="tag in dataSorted" :key="tag" :tag="tag" />
  </div>
</template>

<script lang="ts" setup>
import Tag from './TagFromTree.vue';
import { cloneDeep as _cloneDeep } from 'lodash';
import type { ITags } from '/@main/watcher/tagUpdates';
import { useQueryClient, useQuery } from '@tanstack/vue-query';
import type { Unsubscribable } from 'type-fest';
import { computed, onMounted, onUnmounted } from 'vue';
import { trpcApi } from '/@/utils/trpc';

const queryClient = useQueryClient();

const { isLoading, isError, data, error } = useQuery({
  queryFn: async () => {
    return await trpcApi.getTags.query();
  },
  queryKey: ['tagsTree'],
});

const setData = (data: ITags) => {
  queryClient.setQueryData(['tagsTree'], data);
};

const dataSorted = computed(() =>
  data.value ? [...data.value].sort((a, b) => a.localeCompare(b)) : undefined,
);

const toUnsub: Unsubscribable[] = [];

onMounted(async () => {
  const s1 = trpcApi.tagsUpdate.subscribe(undefined, { onData: setData });
  toUnsub.push(s1);
});

onUnmounted(async () => {
  toUnsub.forEach((s) => s.unsubscribe());
});
</script>

<style scoped></style>
