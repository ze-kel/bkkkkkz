<template>
  <div class="" :class="darkModeClass">
    <div
      v-if="loaded"
      class="flex h-screen flex-col bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50"
    >
      <ViewCore v-if="hasRootPath" />
      <Welcome v-else />
      <NotificationHandler />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, onBeforeMount } from 'vue';

import { debounce as _debounce } from 'lodash';

import Welcome from './WelcomeScreen/WelcomeScreen.vue';
import ViewCore from './ViewCore/ViewCore.vue';
import { trpcApi } from '../utils/trpc';
import { useStore } from '../use/store';
import NotificationHandler from '/@/components/Notifications/NotificationHandler.vue';

const store = useStore();

const hasRootPath = computed(() => {
  return typeof store.rootPath === 'string';
});

const loaded = ref(false);

onBeforeMount(async () => {
  await store.fetchRootPath();
  await store.fetchSetting();
  await store.fetchOpened();
  loaded.value = true;
});

onMounted(async () => {
  window.addEventListener('beforeunload', () => {
    trpcApi.clearAllEvents.mutate();
  });
});

//
// Dark mode class
//

const darkModeClass = computed(() => {
  if (!store.settings || store.settings.darkMode === 'Light') return '';
  if (store.settings.darkMode === 'System') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
  }
  return 'dark';
});

//
// Handle backend notification
//

const r = trpcApi.sendNotification.subscribe(undefined, {
  onData: store.showNotification,
});

onUnmounted(async () => {
  r.unsubscribe();
});
</script>

<style>
#app {
  font-family:
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Inter',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Microsoft YaHei Light',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  background-color: var(--bg-main);
  color: var(--text-main);
}
</style>
