<template>
  <div class="w-full">
    <PathControllerVue title="Root Path" :path="rootPath" @change="changeRootPath" />
    <PathControllerVue
      class="mt-3"
      title="Images Path"
      :path="imagesPath"
      @change="changeImagesPath"
    />
    <hr class="hr-default my-2" />

    <div class="block">
      <h2 class="font-semibold mb-1">Import Goodread .csv</h2>
      <button class="basic-button" @click="importGoodreads">Select</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, onBeforeMount, ref } from 'vue';
import { useElectron } from '/@/use/electron';
import PathControllerVue from './PathController.vue';

import type { ILocalSettings } from '/@main/services/settings';

const emit = defineEmits<{
  (e: 'changeRootPath'): void;
}>();

const api = useElectron();
const settings = ref<ILocalSettings | null>(null);

const imagesPath = computed(() => settings.value?.imagesPath || '');
const changeImagesPath = async () => {
  settings.value = await api.settings.newImagesPath();
};

const rootPath = computed(() => settings.value?.rootPath || '');
const changeRootPath = async () => {
  const result = await api.settings.newRootPath();
  if (result) {
    settings.value = await api.settings.getSettings();
  }
};

const importGoodreads = () => api.parsers.parseGoodreadsCsv();

onBeforeMount(async () => {
  settings.value = await api.settings.getSettings();
});
</script>

<style scoped></style>
