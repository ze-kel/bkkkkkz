<template>
  <ShDialog v-model:open="settingsOpened">
    <ShDialogContent>
      <ShDialogTitle>Settings</ShDialogTitle>
      <Settings />
    </ShDialogContent>
  </ShDialog>
  <div class="flex items-center justify-start py-2">
    <ShButton
      v-test-class="testClasses.menuSettings"
      variant="ghost"
      size="icon"
      @click="flipSettings"
    >
      <Settings2Icon stroke-width="1" />
    </ShButton>

    <ShButton v-test-class="testClasses.menuAddBook" variant="ghost" size="icon" @click="addBook">
      <PlusIcon stroke-width="1" />
    </ShButton>
  </div>
</template>

<script lang="ts" setup>
import Settings from '../Settings/SettingsPage.vue';
import { testClasses } from '~/tools/tests/binds';

import { PlusIcon, Settings2Icon } from 'lucide-vue-next';

const store = useStore();

const settingsOpened = ref(false);
const flipSettings = () => {
  settingsOpened.value = !settingsOpened.value;
};

const addBook = () => {
  if (!store.rootPath) return;
  if (!store.openedItem || store.openedItem.thing !== 'folder') {
    store.openNewOne(
      {
        id: store.generateRandomId(),
        type: 'newFile',
        thing: store.rootPath,
        scrollPosition: 0,
      },
      { place: 'last', focus: true },
    );
  } else {
    store.openNewOne(
      {
        id: store.generateRandomId(),
        type: 'newFile',
        thing: store.openedItem.thing,
        scrollPosition: 0,
      },
      { place: 'current', focus: true },
    );
  }
};
</script>

<style scoped></style>
