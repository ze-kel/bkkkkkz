<template>
  <FileTreeInner v-for="folder in transformed" :content="folder" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { useStore } from '~~/utils/store';
import { invoke } from '@tauri-apps/api/core';
import { filePathsToTree } from './filePathsToTree';
import { useListenToEvent } from '~/api/tauriEvents';
import { throttle } from 'lodash';

const store = useStore();

const { data, refresh } = useAsyncData(() => {
  return invoke('c_get_all_folders', { rootPath: store.rootPath || '' }) as Promise<string[]>;
});

const transformed = computed(() => filePathsToTree(data.value || [], store.rootPath || ''));

const throttledRefresh = throttle(refresh, 1000, {
  leading: true,
});

useListenToEvent('folder_add', () => throttledRefresh());
useListenToEvent('folder_remove', () => throttledRefresh());
</script>
