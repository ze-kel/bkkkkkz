<template>
  <div>
    <Tag v-for="tag in dataSorted" :key="tag" :tag="tag" />
  </div>
</template>

<script lang="ts" setup>
import Tag from './TagFromTree.vue';
import { cloneDeep as _cloneDeep } from 'lodash';
import type { Unsubscribable } from 'type-fest';
import { computed, onBeforeMount, onMounted, onUnmounted } from 'vue';
import { trpcApi } from '/@/utils/trpc';
import { useStore } from '/@/use/store';

const store = useStore();

const dataSorted = computed(() =>
  store.tagsTree ? [...store.tagsTree].sort((a, b) => a.localeCompare(b)) : undefined,
);

const toUnsub: Unsubscribable[] = [];

onBeforeMount(async () => {
  await store.fetchTags();
});

onMounted(async () => {
  const s1 = trpcApi.tagsUpdate.subscribe(undefined, { onData: store.updateTags });
  toUnsub.push(s1);
});

onUnmounted(async () => {
  toUnsub.forEach((s) => s.unsubscribe());
});
</script>

<style scoped></style>
