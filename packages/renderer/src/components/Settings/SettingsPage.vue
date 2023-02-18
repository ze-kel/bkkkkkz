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

      <h2 class="font-semibold mb-1">Import Goodreads .csv</h2>

      <button class="basic-button" @click="importGoodreadsCsv">Select</button>
      <div class="text-xs max-w-xs my-1">
        <p class="text-xs">You can export csv at https://www.goodreads.com/dsar/user</p>
        <p class="my-1">
          Due to GoodReads export limitation only one read date will be imported and only containing
          finish date.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import PathControllerVue from './PathController.vue';
import ButtonsSwitch from '/@/components/_UI/ButtonsSwitch.vue';
import { useStore } from '/@/use/store';
import { importGoodReadsHTML } from '/@/utils/goodreadsHTMLParser';

import { trpcApi } from '/@/utils/trpc';

const store = useStore();

const rootPath = computed(() => store.settings?.rootPath || '');
const changeRootPath = async () => {
  const result = await trpcApi.newRootPath.mutate();
};

const importGoodreadsCsv = () => trpcApi.parseGoodreadsCsv.mutate();

const importHTMLButton = ref<HTMLElement>();

const importHTML = () => {
  if (importHTMLButton.value) importHTMLButton.value.click();
};
</script>

<style scoped></style>
