<template>
  <div class="settings">
    <PathControllerVue class="block" title="Root Path" :path="rootPath" @change="changeRootPath" />
    <PathControllerVue
      class="block"
      title="Images Path"
      :path="imagesPath"
      @change="changeImagesPath"
    />
    <hr />

    <div class="block">
      <h2 class="title">Import Goodread .csv</h2>
      <Button text="Import" @click="importGoodreads" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, onBeforeMount, ref } from 'vue';
import { useElectron } from '/@/use/electron';
import PathControllerVue from './PathController.vue';

import type { ILocalSettings } from '/@main/services/settings';
import Button from '../_UI/Button.vue';

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

<style lang="scss" scoped>
.settings {
  width: 100%;
}
.title {
  font-weight: 400;
  margin-bottom: 8px;
}

.block {
  margin-top: 16px;
}
</style>
