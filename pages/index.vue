<template>
  <div class="flex h-full w-full flex-col items-center justify-center">
    <div class="text-lg">Initializing</div>

    <div class="flex flex-col">
      <div>Db setup: {{ dbSetup }}</div>
      <div>Cache setup: {{ cacheSetup }}</div>
      <div>Watcher setup: {{ watcherSetup }}</div>
    </div>
    <div>
      <ShButton @click="initLoop"> Initialize </ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { invoke } from '@tauri-apps/api/core';

const store = useStore();

const dbSetup = ref(false);
const cacheSetup = ref(false);
const watcherSetup = ref(false);

const initLoop = async () => {
  if (typeof store.rootPath !== 'string') {
    await navigateTo('/welcome');
    return;
  }
  await store.fetchRootPath();
  const rp = store.rootPath;

  await invoke('c_setup_db');
  dbSetup.value = true;
  await invoke('c_prepare_cache', { rootPath: rp });
  cacheSetup.value = true;
  await invoke('c_start_watcher', { rootPath: rp });
  watcherSetup.value = true;

  await navigateTo('/application');
};

onMounted(() => initLoop());

definePageMeta({
  layout: 'empty',
});
</script>
