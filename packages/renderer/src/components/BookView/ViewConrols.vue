<template>
  <div v-if="store.currentViewSettings" class="flex items-center justify-between gap-2 px-2">
    <div class="flex w-3/12 gap-2 py-2">
      <input
        v-model="store.currentViewSettings.searchQuery"
        class="rounded-sm bg-transparent px-2 py-1 outline-none"
        placeholder="Search Books"
      />
      <button
        v-if="store.openedItem?.type === 'folder'"
        class="h-full w-fit whitespace-nowrap"
        @click="addBook"
      >
        Add book
      </button>
    </div>

    <div class="flex w-fit">
      <div
        class="group mr-2 p-1"
        :class="store.currentViewSettings.grouped ? '' : ''"
        @click="flipGrouped"
      >
        <ReactangleStackIcon class="w-6" />
      </div>

      <ButtonsSwitch
        v-model="store.currentViewSettings.viewStyle"
        class="mr-2"
        :options="[{ key: 'Covers' }, { key: 'Lines' }]"
        :option-classes="['px-1']"
      >
        <template #option="{ key }">
          <SquaresIcon v-if="key === 'Covers'" class="w-6" />
          <TableIcon v-if="key === 'Lines'" class="w-6" />
        </template>
      </ButtonsSwitch>

      <select v-model="store.currentViewSettings.sortBy" class="">
        <option v-for="item in canSortby" :key="item">{{ item }}</option>
      </select>

      <div
        class="group ml-2 flex aspect-square h-full items-center justify-center p-1"
        @click="flipSortDirection"
      >
        <ArrowDown
          class="w-6"
          :class="[store.currentViewSettings.sortDirection < 0 && 'rotate-180']"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import ReactangleStackIcon from '@heroicons/vue/24/outline/RectangleStackIcon';
import SquaresIcon from '@heroicons/vue/24/outline/Square2StackIcon';
import TableIcon from '@heroicons/vue/24/outline/TableCellsIcon';
import ArrowDown from '@heroicons/vue/24/outline/ArrowDownIcon';

import ButtonsSwitch from '../_UI/ButtonsSwitch.vue';
import type { ISortByOption } from '/@main/services/openedTabs';

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

const addBook = () => {
  if (!store.openedItem) return;
  store.openNewOne({ type: 'newFile', thing: store.openedItem.thing, scrollPosition: 0 });
};
</script>
