<template>
  <div v-if="store.currentViewSettings" class="px-2 flex gap-2 items-center justify-between">
    <div class="flex gap-2 w-3/12 py-2">
      <input
        v-model="store.currentViewSettings.searchQuery"
        class="input-default border border-neutral-900 dark:border-neutral-50 rounded-sm px-2 py-1"
        placeholder="Search Books"
      />
      <button
        v-if="store.openedItem?.type === 'folder'"
        class="basic-button h-full w-fit whitespace-nowrap"
        @click="addBook"
      >
        Add book
      </button>
    </div>

    <div v-if="store.settings" class="flex w-fit">
      <div
        class="group p-1 mr-2"
        :class="store.currentViewSettings.grouped ? 'basic-button-inverted' : 'basic-button'"
        @click="flipGrouped"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" class="transition-colors">
          <path d="M21 19H3V17H21V19ZM10 15H3V13H10V15ZM21 11H3V9H21V11ZM10 7H3V5H10V7Z" />
        </svg>
      </div>

      <ButtonsSwitch
        v-model="store.currentViewSettings.viewStyle"
        class="mr-2"
        :options="[{ key: 'Covers' }, { key: 'Lines' }]"
        :option-classes="['px-1']"
      >
        <template #option="{ key }">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              v-if="key === 'Covers'"
              d="M20 20H16V16H20V20ZM14 20H10V16H14V20ZM8 20H4V16H8V20ZM20 14H16V10H20V14ZM14 14H10V10H14V14ZM8 14H4V10H8V14ZM20 8H16V4H20V8ZM14 8H10V4H14V8ZM8 8H4V4H8V8Z"
            />
            <path v-if="key === 'Lines'" d="M21 18H3V16H21V18ZM21 13H3V11H21V13ZM21 8H3V6H21V8Z" />
          </svg>
        </template>
      </ButtonsSwitch>

      <select v-model="store.currentViewSettings.sortBy" class="basic-button">
        <option v-for="item in canSortby" :key="item">{{ item }}</option>
      </select>

      <div
        class="group p-1 basic-button aspect-square h-full flex items-center justify-center ml-2"
        @click="flipSortDirection"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            v-if="store.currentViewSettings.sortDirection > 0"
            d="M13 5.83L15.59 8.41L17 7L12 2L7 7L8.41 8.41L11 5.83V22H13V5.83Z"
          />
          <path v-else d="M16 18H13V2L11 2V18H8L12 22L16 18Z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { useStore } from '/@/use/store';
import type { ISortByOption } from '/@main/services/watcher';
import ButtonsSwitch from '../_UI/ButtonsSwitch.vue';

const store = useStore();

const emit = defineEmits<{
  (e: 'update:search', val: string): void;
  (e: 'addBook'): void;
}>();

const canSortby: ISortByOption[] = [
  'Author',
  'Title',
  'Rating',
  'Year',
  'Last Read',
  'First Read',
  'Filename',
];

const flipSortDirection = () => {
  if (!store.currentViewSettings) return;
  //@ts-expect-error this is correct
  store.currentViewSettings.sortDirection = store.currentViewSettings.sortDirection * -1;
};

const flipGrouped = () => {
  if (!store.currentViewSettings) return;
  store.currentViewSettings.grouped = !store.currentViewSettings.grouped;
};

onUnmounted(() => {
  store.saveSettings();
});

const addBook = () => {
  if (!store.openedItem) return;
  store.openNewOne({ type: 'newFile', thing: store.openedItem.thing, scrollPosition: 0 });
};
</script>
