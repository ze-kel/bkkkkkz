<template>
  <div class="w-full">
    <PathControllerVue title="Root Path" :path="rootPath" @change="changeRootPath" />
    <PathControllerVue
      class="mt-3"
      title="Images Path"
      :path="imagesPath"
      @change="changeImagesPath"
    />
    <hr class="hr-default" />

    <div class="block">
      <h2 class="font-semibold mb-1">Import Goodread .csv</h2>
      <button
        class="
          bg-indigo-600
          hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200
          text-white
          px-3
          py-1
          rounded-md
          transition-colors
        "
        @click="importGoodreads"
      >
        Select
      </button>
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

const internalInstance = getCurrentInstance();
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
    internalInstance?.emit('changeRootPath');
  }
};

const importGoodreads = () => api.parsers.parseGoodreadsCsv();

onBeforeMount(async () => {
  settings.value = await api.settings.getSettings();
});
</script>

<style scoped></style>
