<template>
  <div v-if="store.settings" class="w-full">
    <PathControllerVue title="Root Path" :path="rootPath" @change="changeRootPath" />

    <hr class="hr-default my-2" />

    <div class="">
      <h2 class="font-semibold mb-1">Theme</h2>
      <ButtonsSwitch
        v-model="store.settings.darkMode"
        :options="[
          { label: 'Light', key: -1 },
          { label: 'System', key: 0 },
          { label: 'Dark', key: 1 },
        ]"
      >
        <template #option="{ label }">{{ label }}</template>
      </ButtonsSwitch>
    </div>

    <div class="my-2">
      <h2 class="font-semibold mb-1">Import Goodread .csv</h2>
      <button class="basic-button" @click="importGoodreads">Select</button>
      <p class="text-xs max-w-xs my-1">
        Note: due to GoodReads export limitation only one read date will be imported and only
        containing finish date.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useElectron } from '/@/use/electron';
import PathControllerVue from './PathController.vue';
import ButtonsSwitch from '/@/components/_UI/ButtonsSwitch.vue';
import { useStore } from '/@/use/store';

import type { ILocalSettings } from '/@main/services/settings';

const store = useStore();
const api = useElectron();

const rootPath = computed(() => store.settings?.rootPath || '');
const changeRootPath = async () => {
  const result = await api.settings.newRootPath();
};

const importGoodreads = () => api.parsers.parseGoodreadsCsv();

const setDarkMode = (val: -1 | 0 | 1) => {
  if (!store.settings) return;
  store.settings.darkMode = val;
};
</script>

<style scoped></style>
