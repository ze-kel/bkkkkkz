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

      <ShSelect v-model="colorMode.preference" class="w-40">
        <ShSelectTrigger>
          <ShSelectValue placeholder="Sort by" />
        </ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem value="light">Light</ShSelectItem>
          <ShSelectItem value="system">System</ShSelectItem>
          <ShSelectItem value="dark">Dark</ShSelectItem>
        </ShSelectContent>
      </ShSelect>
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
          <ShButton variant="outline" class="mt-1" @click="importHTML">Select</ShButton></label
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

import { useStore } from '~~/utils/store';

import { saveSettings } from '~/api/settings';
import { selectAndSetRootPath } from '~/api/rootPath';

const colorMode = useColorMode();

const store = useStore();

const darkMode = computed({
  get: () => {
    return store.settings?.darkMode || 'System';
  },
  set: async (val) => {
    if (!store.settings) return;

    const s = { ...store.settings, darkMode: val };

    await saveSettings(s);

    store.updateSettings(s);
  },
});

const importHTMLButton = ref<HTMLElement>();

const importHTML = () => {
  if (importHTMLButton.value) importHTMLButton.value.click();
};

const changeRootPathHandler = async () => {
  const updated = await selectAndSetRootPath();
  if (updated) {
    store.fetchRootPath();
  }
};
</script>

<style scoped></style>
