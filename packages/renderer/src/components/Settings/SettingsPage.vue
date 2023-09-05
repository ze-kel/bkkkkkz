<template>
  <div v-if="store.settings" class="w-full">
    <PathControllerVue
      v-if="store.rootPath"
      title="Root Path"
      :path="store.rootPath"
      @change="trpcApi.setRootPath.mutate"
    />

    <hr class="my-2 h-[1px] w-full border-0 bg-neutral-200 dark:bg-neutral-700" />

    <div class="">
      <h2 class="mb-1 font-semibold">Theme</h2>
      <ButtonsSwitch
        v-model="darkMode"
        :options="[
          { label: 'Light', key: -1 },
          { label: 'System', key: 0 },
          { label: 'Dark', key: 1 },
        ]"
      >
        <template #option="{ option }">{{ option.key }}</template>
      </ButtonsSwitch>
    </div>

    <div class="my-2">
      <div>
        <h2 class="mb-1 font-semibold">Import Goodreads .html</h2>
        <input ref="importHTMLButton" type="file" class="hidden" @change="importGoodReadsHTML" />
        <button class="" @click="importHTML">Select</button>
        <div class="my-1 max-w-xs text-xs">
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
import { importGoodReadsHTML } from '/@/utils/goodreadsHTMLParser';

import { useStore } from '/@/use/store';
import { trpcApi } from '/@/utils/trpc';

const store = useStore();

const darkMode = computed({
  get: () => {
    return store.settings?.darkMode || 0;
  },
  set: (val) => {
    if (!store.settings) return;

    store.updateSettings({ ...store.settings, darkMode: val });
  },
});

const importHTMLButton = ref<HTMLElement>();

const importHTML = () => {
  if (importHTMLButton.value) importHTMLButton.value.click();
};
</script>

<style scoped></style>
