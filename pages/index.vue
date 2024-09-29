<template>
  <div class="" :class="darkModeClass">
    <div
      v-if="loaded"
      class="flex h-screen flex-col bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50"
    >
      <ViewCore v-if="typeof store.rootPath === 'string'" />
      <WelcomeScreen v-else />
      <NotificationsNotificationHandler />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, onBeforeMount, watch } from 'vue';

import { debounce as _debounce } from 'lodash';

import { useStore } from '~~/utils/store';

const store = useStore();

watch(
  () => store.rootPath,
  async () => {
    if (typeof store.rootPath !== 'string') return;
    await store.fetchSetting();
    await store.fetchOpened();
    await store.fetchTags();
  },
  { immediate: false },
);

const loaded = ref(false);

onBeforeMount(async () => {
  await store.fetchRootPath();
  if (typeof store.rootPath === 'string') {
    await store.fetchSetting();
    await store.fetchOpened();
  }
  loaded.value = true;
});

//
// Dark mode class
//
const darkModeClass = computed(() => {
  if (!store.settings || store.settings.darkMode === 'System') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
  }
  if (store.settings.darkMode === 'Light') return '';

  return 'dark';
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

::-webkit-scrollbar {
  -webkit-appearance: none;
  @apply w-3;
}
::-webkit-scrollbar-thumb {
  @apply bg-neutral-400;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-neutral-500;
}

::-webkit-scrollbar-track {
  @apply bg-neutral-200;
}

.dark ::-webkit-scrollbar-track {
  @apply bg-neutral-900;
}

.dark ::-webkit-scrollbar-thumb {
  @apply bg-neutral-700;
}

.dark ::-webkit-scrollbar-thumb:hover {
  @apply bg-neutral-600;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input {
  outline: none;
}

.editor {
  outline: none;
}

.dragApp {
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
</style>
