<template>
  <div v-if="store.currentViewSettings" class="flex items-center justify-between gap-2 px-2">
    <div class="flex w-3/12 gap-2 py-2">
      <input
        v-model="store.currentViewSettings.searchQuery"
        class="rounded-sm border border-neutral-100 bg-transparent px-2 py-1 outline-none transition-colors focus:border-neutral-300 dark:border-neutral-800"
        placeholder="Search Books"
      />
    </div>

    <div class="flex w-fit">
      <div
        class="group mr-2 cursor-pointer rounded p-1 transition-colors"
        :class="
          store.currentViewSettings.grouped
            ? 'bg-neutral-300 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-800'
            : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
        "
        @click="flipGrouped"
      >
        <ReactangleStackIcon
          class="w-6 transition-colors"
          :class="
            store.currentViewSettings.grouped
              ? 'stroke-neutral-700 dark:stroke-neutral-400'
              : 'stroke-neutral-500 dark:stroke-neutral-600'
          "
        />
      </div>

      <ButtonsSwitch
        v-model="store.currentViewSettings.viewStyle"
        class="mr-2"
        :options="[{ key: 'Covers' }, { key: 'Lines' }]"
        :option-classes="['px-1 flex items-center justify-center']"
      >
        <template #option="{ option, active }">
          <SquaresIcon
            v-if="option.key === 'Covers'"
            class="w-6"
            :class="
              active
                ? 'stroke-neutral-700 dark:stroke-neutral-400'
                : 'stroke-neutral-500 dark:stroke-neutral-600'
            "
          />
          <TableIcon
            v-if="option.key === 'Lines'"
            class="w-6"
            :class="
              active
                ? 'stroke-neutral-700 dark:stroke-neutral-400'
                : 'stroke-neutral-500 dark:stroke-neutral-600'
            "
          />
        </template>
      </ButtonsSwitch>

      <select
        v-model="store.currentViewSettings.sortBy"
        class="rounded border border-neutral-200 bg-transparent px-1 focus:outline-none dark:border-neutral-700 dark:text-neutral-500"
      >
        <option v-for="item in canSortby" :key="item">{{ item }}</option>
      </select>

      <div
        class="group ml-2 flex aspect-square h-full cursor-pointer items-center justify-center p-1"
        @click="flipSortDirection"
      >
        <ArrowDown
          class="w-6 stroke-neutral-700 transition-transform"
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
</script>
