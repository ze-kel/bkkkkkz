<template>
  <div class="flex h-full w-full flex-col items-center justify-center">
    <div
      class="bg-card text-card-foreground w-[350px] max-w-80 rounded-lg border border-neutral-300 px-6 py-4 shadow-sm dark:border-neutral-600"
    >
      <div class="text-2xl">Initializing</div>

      <div class="mt-2 flex flex-col gap-1 font-light">
        <div class="flex justify-between">
          Database
          <div>
            <CheckIcon v-if="dbSetup" />
            <LoaderCircle v-else class="animate-spin" />
          </div>
        </div>
        <div class="flex justify-between">
          Cache
          <div>
            <CheckIcon v-if="cacheSetup" />
            <LoaderCircle v-else class="animate-spin" />
          </div>
        </div>
        <div class="flex justify-between">
          File watcher
          <div>
            <CheckIcon v-if="watcherSetup" />
            <LoaderCircle v-else class="animate-spin" />
          </div>
        </div>
      </div>
      <ShButton class="mt-4 w-full" variant="outline" @click="initLoop"> Restart </ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { invoke } from '@tauri-apps/api/core';
import { CheckIcon, LoaderCircle } from 'lucide-vue-next';

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
