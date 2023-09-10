<template>
  <div class="" :class="darkModeClass">
    <div
      class="bg-neutral-50 flex h-screen flex-col dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50"
    >
      <TopBar />
      <ContextMenu />

      <ViewCore v-if="hasRootPath" />
      <Welcome v-else />
    </div>
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
import { useStore } from '../use/store';

const store = useStore();

const hasRootPath = computed(() => {
  return typeof store.rootPath === 'string';
});

onBeforeMount(() => {
  store.fetchRootPath();
  store.fetchSetting();
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

const darkModeClass = computed(() => {
  if (!store.settings || store.settings.darkMode === -1) return '';
  if (store.settings.darkMode === 0) {
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
