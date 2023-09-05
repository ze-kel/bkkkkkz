<template>
  <Popup :opened="settingsOpened" @close="flipSettings">
    <Settings />
  </Popup>
  <div class="flex items-center justify-start gap-1 py-2">
    <div
      class="rounded p-1 transition-colors"
      :class="[
        homeOpened
          ? 'bg-neutral-300  dark:bg-neutral-600 '
          : 'cursor-pointer  hover:bg-neutral-200 hover:stroke-neutral-700 dark:hover:bg-neutral-700',
      ]"
      @click="openHome"
    >
      <HomeIcon
        class="w-6"
        :class="
          homeOpened
            ? 'stroke-neutral-800 dark:stroke-neutral-300'
            : 'stroke-neutral-700 dark:stroke-neutral-400'
        "
      />
    </div>
    <div
      class="cursor-pointer rounded p-1 hover:bg-neutral-200 hover:stroke-neutral-700 dark:hover:bg-neutral-700"
      @click="flipSettings"
    >
      <CogIcon class="w-6 stroke-neutral-700 dark:stroke-neutral-400" />
    </div>
    <div
      class="cursor-pointer rounded p-1 hover:bg-neutral-200 hover:stroke-neutral-700 dark:hover:bg-neutral-700"
      @click="addBook"
    >
      <PlusIcon class="w-6 stroke-neutral-700 dark:stroke-neutral-400" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import Popup from '../_UI/Popup.vue';
import Settings from '../Settings/SettingsPage.vue';
import { useStore } from '/@/use/store';

import HomeIcon from '@heroicons/vue/24/outline/HomeIcon';
import CogIcon from '@heroicons/vue/24/outline/Cog8ToothIcon';
import PlusIcon from '@heroicons/vue/24/outline/PlusIcon';

const store = useStore();

const settingsOpened = ref(false);
const flipSettings = () => {
  settingsOpened.value = !settingsOpened.value;
};

const openHome = () => {
  store.openNewOne({ type: 'innerPage', thing: 'home', scrollPosition: 0 });
};

const homeOpened = computed(() => {
  return (
    store.openedItem && store.openedItem.type === 'innerPage' && store.openedItem.thing === 'home'
  );
});

const addBook = () => {
  if (!store.rootPath) return;
  if (!store.openedItem || store.openedItem.thing !== 'folder') {
    store.openNewOne({ type: 'newFile', thing: store.rootPath, scrollPosition: 0 });
  } else {
    store.openNewOne({ type: 'newFile', thing: store.openedItem.thing, scrollPosition: 0 });
  }
};
</script>

<style scoped></style>
