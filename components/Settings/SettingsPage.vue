<template>
  <ShDialogTitle>Settings</ShDialogTitle>
  <div v-if="store.settings" class="w-full max-w-[500px]">
    <PathControllerVue
      v-if="store.rootPath"
      title="Working Directory"
      :path="store.rootPath"
      @change="changeRootPathHandler"
    />

    <ShButton @click="navigateTo('/schemas')">Edit schema</ShButton>

    <div class="mt-4">
      <h2 class="mb-2 font-semibold">Theme</h2>

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
