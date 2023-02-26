<template>
  <Popup :opened="settingsOpened" @close="flipSettings">
    <Settings />
  </Popup>
  <div class="flex justify-start items-center py-2 gap-1">
    <div class="icon bg-transparent dark:bg-transparent aspect-square p-1" @click="openHome">
      <HomeIcon class="w-6" />
    </div>
    <div class="icon bg-transparent dark:bg-transparent aspect-square p-1" @click="flipSettings">
      <CogIcon class="w-6" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Popup from '../_UI/Popup.vue';
import Settings from '../Settings/SettingsPage.vue';
import { useStore } from '/@/use/store';

import HomeIcon from '@heroicons/vue/24/outline/HomeIcon';
import CogIcon from '@heroicons/vue/24/outline/Cog8ToothIcon';

const store = useStore();

const settingsOpened = ref(false);
const flipSettings = () => {
  settingsOpened.value = !settingsOpened.value;
};

const openHome = () => {
  store.openNewOne({ type: 'innerPage', thing: 'home', scrollPosition: 0 });
};
</script>

<style scoped></style>
