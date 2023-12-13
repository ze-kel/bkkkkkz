<template>
  <Popup :opened="settingsOpened" @close="flipSettings">
    <Settings />
  </Popup>
  <div class="flex items-center justify-start py-2">
    <BasicButton variant="ghost" size="icon" @click="openHome">
      <HomeIcon stroke-width="1" />
    </BasicButton>

    <BasicButton variant="ghost" size="icon" @click="flipSettings">
      <Settings2Icon stroke-width="1" />
    </BasicButton>

    <BasicButton variant="ghost" size="icon" @click="addBook">
      <PlusIcon stroke-width="1" />
    </BasicButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import Popup from '../_UI/PopupComponent.vue';
import Settings from '../Settings/SettingsPage.vue';
import { useStore } from '/@/use/store';

import { PlusIcon, Settings2Icon, HomeIcon } from 'lucide-vue-next';
import BasicButton from '/@/components/_UI/BasicButton/BasicButton.vue';

const store = useStore();

const settingsOpened = ref(false);
const flipSettings = () => {
  settingsOpened.value = !settingsOpened.value;
};

const openHome = () => {
  store.openNewOne(
    { id: store.generateRandomId(), type: 'innerPage', thing: 'home', scrollPosition: 0 },
    { place: 'last', focus: true },
  );
};

const homeOpened = computed(() => {
  return (
    store.openedItem && store.openedItem.type === 'innerPage' && store.openedItem.thing === 'home'
  );
});

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
