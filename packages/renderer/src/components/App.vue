<template>
  <div
    ref="rootElement"
    class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 h-screen flex flex-col"
    :class="darkModeClass"
  >
    <TopBar />
    <ContextMenu />
    <Welcome v-if="store.initialSetup" />
    <div
      v-if="store.initialized"
      class="h-full max-h-full flex overflow-hidden bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
    >
      <div class="flex-auto px-2 box-border" :style="{ width: `${fileTreeSize}px` }">
        <IconsMenu />

        <div class="overflow-y-auto overflow-x-hidden">
          <FileTree />

          <hr class="hr-default my-3" />
          <TagsTree />
        </div>
      </div>

      <div
        ref="resizeHandle"
        class="w-1 hover:bg-indigo-500 cursor-col-resize transition-colors"
        :class="isResizing && 'bg-indigo-700'"
      ></div>
      <div class="bg-neutral-50 dark:bg-neutral-900 flex w-full max-h-full overflow-hidden">
        <View />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';
import { useStore } from '/@/use/store';

import { debounce as _debounce } from 'lodash';

import IconsMenu from './IconsMenu/IconsMenu.vue';
import TopBar from './TopBar/TopBar.vue';
import FileTree from './FileTree/FileTree.vue';
import Welcome from './WelcomeScreen/Welcome.vue';
import ContextMenu from './_UI/ContextMenu.vue';
import TagsTree from './TagsTree/TagsTree.vue';
import View from './View/AppView.vue';

const store = useStore();

const fileTreeSize = ref<number>(200);

const resizeHandle = ref<Element | null>(null);
const rootElement = ref<Element | null>(null);

const isResizing = ref<boolean>(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changeFileTreeSize = (ev: any) => {
  const newVal = ev.clientX;
  if (newVal < 500 && newVal > 150) {
    fileTreeSize.value = ev.clientX;
  }
};

onMounted(async () => {
  await store.initCore();

  // Not sure, perhaps there is a better way to watch for changes?
  watch(
    () => store.settings,
    () => {
      store.saveSettings();
    },
    { deep: true },
  );

  resizeHandle.value?.addEventListener('mousedown', () => {
    isResizing.value = true;
    rootElement.value?.addEventListener('mousemove', changeFileTreeSize);
    rootElement.value?.addEventListener('mouseup', () => {
      isResizing.value = false;
      rootElement.value?.removeEventListener('mousemove', changeFileTreeSize);
    });
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', globalShortcuts);
});

//
// Global shortcuts
//
const globalShortcuts = (e: KeyboardEvent) => {
  if (e.key === 'w' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (store.activeOpenedIndex >= 0) {
      store.closeOpened(store.activeOpenedIndex);
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
