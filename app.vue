<template>
  <div
    class="flex h-screen flex-col bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount, watch } from 'vue';

import { debounce as _debounce } from 'lodash';

import { useStore } from '~/utils/store';

const store = useStore();

const darkModeClass = computed(() => {
  if (!store.settings || store.settings.darkMode === 'System') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
  }
  if (store.settings.darkMode === 'Light') return '';

  return 'dark';
});

onBeforeMount(async () => {
  await store.fetchRootPath();
});

useHead({
  htmlAttrs: {
    class: [
      darkModeClass.value,
      darkModeClass.value === 'dark'
        ? 'bg-gradient-to-t from-neutral-900 from-20% to-neutral-950 to-80%'
        : 'bg-gradient-to-t from-neutral-200 from-20% to-neutral-50 to-80%',
    ],
  },
  bodyAttrs: {
    class: 'min-h-screen',
  },
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
