<template>
  <div v-if="store.currentViewSettings" class="flex items-center justify-between gap-2 py-2">
    <div class="flex w-3/12 gap-2">
      <input
        v-model="store.currentViewSettings.searchQuery"
        class="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
        placeholder="Search Books"
      />
    </div>

    <div class="flex w-fit gap-3">
      <ShButton variant="outline" size="icon" @click="flipGrouped">
        <GroupIcon v-if="store.currentViewSettings.grouped" stroke-width="1" />
        <UngroupIcon v-else stroke-width="1" />
      </ShButton>

      <ShSelect v-model="store.currentViewSettings.sortBy">
        <ShSelectTrigger>
          <ShSelectValue placeholder="Sort by" class="w-32" />
        </ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="item in canSortby" :key="item" :value="item"
            >{{ item }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>

      <ShButton variant="outline" size="icon" @click="flipSortDirection">
        <ArrowDownZAIcon v-if="store.currentViewSettings.sortDirection < 0" stroke-width="1" />
        <ArrowDownAZIcon v-else stroke-width="1" />
      </ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { GroupIcon, UngroupIcon, ArrowDownAZIcon, ArrowDownZAIcon } from 'lucide-vue-next';

import type { ISortByOption } from '~/api/openedTabs';

const store = useStore();

const emit = defineEmits<{
  (e: 'update:search', val: string): void;
  (e: 'addBook'): void;
}>();

const canSortby: ISortByOption[] = ['Author', 'Title', 'Rating', 'Year', 'Last Read', 'First Read'];

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
