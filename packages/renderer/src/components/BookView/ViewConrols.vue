<template>
  <div v-if="store.currentViewSettings" class="flex items-center justify-between gap-2 px-2">
    <div class="flex w-3/12 gap-2 py-2">
      <input
        v-model="store.currentViewSettings.searchQuery"
        class="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
        placeholder="Search Books"
      />
    </div>

    <div class="flex w-fit gap-3">
      <BasicButton variant="outline" size="icon" @click="flipGrouped">
        <GroupIcon v-if="store.currentViewSettings.grouped" stroke-width="1" />
        <UngroupIcon v-else stroke-width="1" />
      </BasicButton>

      <ButtonsSwitch
        v-model="store.currentViewSettings.viewStyle"
        :options="[{ key: 'Covers' }, { key: 'Lines' }]"
        :option-classes="['px-1 flex items-center justify-center']"
      >
        <template #option="{ option }">
          <BookIcon v-if="option.key === 'Covers'" stroke-width="1" class="w-6" />
          <TableIcon v-if="option.key === 'Lines'" stroke-width="1" class="w-6" />
        </template>
      </ButtonsSwitch>

      <select
        v-model="store.currentViewSettings.sortBy"
        class="rounded border border-neutral-200 bg-transparent px-1 focus:outline-none dark:border-neutral-700 dark:text-neutral-500"
      >
        <option v-for="item in canSortby" :key="item">{{ item }}</option>
      </select>

      <BasicButton variant="outline" size="icon" @click="flipSortDirection">
        <ArrowDownZAIcon v-if="store.currentViewSettings.sortDirection < 0" stroke-width="1" />
        <ArrowDownAZIcon v-else stroke-width="1" />
      </BasicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import {
  GroupIcon,
  UngroupIcon,
  ArrowDownAZIcon,
  ArrowDownZAIcon,
  TableIcon,
  BookIcon,
} from 'lucide-vue-next';

import ButtonsSwitch from '../_UI/ButtonsSwitch.vue';
import type { ISortByOption } from '/@main/services/openedTabs';
import BasicButton from '/@/components/_UI/BasicButton.vue';

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
