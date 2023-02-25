<template>
  <div
    ref="rootElement"
    class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 h-screen flex flex-col"
    :class="darkModeClass"
  >
    <TopBar />
    <ContextMenu />

    <ViewCore v-if="hasRootPath" />
    <Welcome v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, onBeforeMount } from 'vue';

import { debounce as _debounce } from 'lodash';

import TopBar from './TopBar/TopBar.vue';
import Welcome from './WelcomeScreen/WelcomeScreen.vue';
import ContextMenu from './_UI/ContextMenu.vue';
import ViewCore from './ViewCore/ViewCore.vue';
import { trpcApi } from '../utils/trpc';
import { useRootPath } from '../use/rootPath';
import { useSettings } from '../use/settings';
import { useStore } from '../use/store';

const store = useStore();

const rootElement = ref<Element | null>(null);

const { rootPath } = useRootPath();

const hasRootPath = computed(() => {
  return typeof rootPath.value === 'string';
});

onBeforeMount(() => {
  store.fetchOpened();
});

onMounted(async () => {
  window.addEventListener('beforeunload', () => {
    trpcApi.clearAllEvents.mutate();
  });
});

//
// Global shortcuts
//

const globalShortcuts = (e: KeyboardEvent) => {
  if (e.key === 'w' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (typeof store.opened.active === 'number') {
      store.closeOpened(store.opened.active);
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', globalShortcuts);
});

onUnmounted(() => {
  document.removeEventListener('keydown', globalShortcuts);
});

//
// Dark mode class
//

const { settings } = useSettings();

const darkModeClass = computed(() => {
  if (!settings.value || settings.value.darkMode === -1) return '';
  if (settings.value.darkMode === 0) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
  }
  return 'dark';
});
</script>

<style>
#app {
  font-family: BlinkMacSystemFont, 'SF PRO DISPLAY', 'Roboto', 'Segoe UI';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  background-color: var(--bg-main);
  color: var(--text-main);
}
</style>
