<template>
  <FileTreeInner v-for="folder in transformed" :content="folder" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { useStore } from '~~/utils/store';
import { filePathsToTree } from './filePathsToTree';
import { useListenToEvent } from '~/api/tauriEvents';
import { throttle } from 'lodash';
import { c_get_all_folders } from '~/api/tauriActions';

const store = useStore();

const { data, refresh, status } = useAsyncData(async () => {
  return await c_get_all_folders();
});

const isError = computed(() => data.value && 'isError' in data.value);
const transformed = computed(() =>
  !data.value || 'isError' in data.value ? [] : filePathsToTree(data.value, store.rootPath || ''),
);

const throttledRefresh = throttle(refresh, 1000, {
  leading: true,
});

useListenToEvent('folder_add', () => throttledRefresh());
useListenToEvent('folder_remove', () => throttledRefresh());
</script>
