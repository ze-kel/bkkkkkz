<template>
  <div v-if="settings" class="w-full">
    <PathControllerVue title="Root Path" :path="rootPath" @change="changeRootPath" />

    <hr class="hr-default my-2" />

    <div class="">
      <h2 class="font-semibold mb-1">Theme</h2>
      <ButtonsSwitch
        v-model="darkMode"
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
      <div>
        <h2 class="font-semibold mb-1">Import Goodreads .html</h2>
        <input ref="importHTMLButton" type="file" class="hidden" @change="importGoodReadsHTML" />
        <button class="basic-button" @click="importHTML">Select</button>
        <div class="text-xs max-w-xs my-1">
          <p class="text-xs">
            Go to Goodreads -> My Books -> Print. Select maximum amount of books per page on the
            bottom and save .html
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import PathControllerVue from './PathController.vue';
import ButtonsSwitch from '/@/components/_UI/ButtonsSwitch.vue';
import { useRootPathSafe } from '/@/use/rootPath';
import { useSettings } from '/@/use/settings';
import { importGoodReadsHTML } from '/@/utils/goodreadsHTMLParser';

import { trpcApi } from '/@/utils/trpc';

const { rootPath, changeRootPath } = useRootPathSafe();
const { settings, changeSettings } = useSettings();

const darkMode = computed({
  get: () => {
    return settings.value?.darkMode || 0;
  },
  set: (val) => {
    if (!settings.value) return;

    changeSettings({ ...settings.value, darkMode: val });
  },
});

const importHTMLButton = ref<HTMLElement>();

const importHTML = () => {
  if (importHTMLButton.value) importHTMLButton.value.click();
};
</script>

<style scoped></style>
