<template>
  <div v-if="store.settings" class="w-full max-w-[500px]">
    <PathControllerVue
      v-if="store.rootPath"
      title="Working Directory"
      :path="store.rootPath"
      @change="changeRootPathHandler"
    />

    <div class="mt-4">
      <h2 class="font-semibold">Theme</h2>
      <SelectorRoot v-model="darkMode" class="6 mt-1 w-36">
        <SelectorItem v-for="item in ['Light', 'System', 'Dark']" :key="item" :value="item">
          {{ item }}
        </SelectorItem>
      </SelectorRoot>
    </div>

    <div class="mt-4">
      <div>
        <h2 class="font-semibold">Import Goodreads .html</h2>
        <input
          id="grhtmlinput"
          ref="importHTMLButton"
          type="file"
          class="hidden"
          @change="importGoodReadsHTML"
        />
        <label for="grhtmlinput">
          <BasicButton variant="outline" class="mt-1" @click="importHTML"
            >Select</BasicButton
          ></label
        >
        <div class="mt-2 max-w-xs text-xs">
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
import { importGoodReadsHTML } from '~/utils/goodreadsHTMLParser';

import { useStore } from '~~/utils/store';

import { SelectorRoot, SelectorItem } from '~/components/_UI/Selector';
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';

const store = useStore();
const { $trpc } = useNuxtApp();

const darkMode = computed({
  get: () => {
    return store.settings?.darkMode || 'System';
  },
  set: async (val) => {
    if (!store.settings) return;

    const s = { ...store.settings, darkMode: val };

    await $trpc.saveSettings.mutate(s);

    store.updateSettings(s);
  },
});

const importHTMLButton = ref<HTMLElement>();

const importHTML = () => {
  if (importHTMLButton.value) importHTMLButton.value.click();
};

const changeRootPathHandler = async () => {
  const updated = await $trpc.setRootPath.mutate();
  if (updated) {
    store.fetchRootPath();
  }
};
</script>

<style scoped></style>
