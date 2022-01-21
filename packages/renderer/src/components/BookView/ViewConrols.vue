<template>
  <div class="px-2 flex gap-2 items-stretch justify-between">
    <div class="flex gap-2 w-3/12">
      <input v-model="searchProxy" class="input-default" placeholder="Search Books" />
      <div class="pl-[1px] bg-gray-900 h-full"></div>
      <button
        v-if="showAddButton"
        class="basic-button h-full w-fit whitespace-nowrap"
        @click="addBook"
      >
        Add book
      </button>
    </div>

    <div class="flex w-fit">
      <div
        class="group p-1 mr-2"
        :class="grouped ? 'basic-button-inverted' : 'basic-button'"
        @click="flipGrouped"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          class="transition-colors"
          :class="
            grouped
              ? ['fill-white', 'group-hover:fill-gray-800']
              : ['fill-gray-800', 'group-hover:fill-white']
          "
        >
          <path d="M21 19H3V17H21V19ZM10 15H3V13H10V15ZM21 11H3V9H21V11ZM10 7H3V5H10V7Z" />
        </svg>
      </div>

      <select v-model="sortByProxy" class="basic-button">
        <option v-for="item in canSortby" :key="item">{{ item }}</option>
      </select>

      <div
        class="group p-1 basic-button aspect-square h-full flex items-center justify-center ml-2"
        @click="flipSortDirection"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          class="fill-gray-800 group-hover:fill-white transition-colors"
        >
          <path
            v-if="sortDirection > 0"
            d="M13 5.83L15.59 8.41L17 7L12 2L7 7L8.41 8.41L11 5.83V22H13V5.83Z"
          />
          <path v-else d="M16 18H13V2L11 2V18H8L12 22L16 18Z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue';

import type { PropType } from 'vue';
import type { ISortByOption, ISortDirection } from './getSortFunction';

const props = defineProps({
  search: {
    type: String,
    required: true,
  },
  grouped: {
    type: Boolean,
    required: true,
  },
  sortBy: {
    type: String as PropType<ISortByOption>,
    required: true,
  },
  sortDirection: {
    type: Number as PropType<ISortDirection>,
    required: true,
  },

  showAddButton: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'update:search', val: string): void;
  (e: 'update:grouped', val: boolean): void;
  (e: 'update:sortBy', val: ISortByOption): void;
  (e: 'update:sortDirection', val: ISortDirection): void;
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
  //@ts-expect-error This is correct
  emit('update:sortDirection', props.sortDirection * -1);
};

const sortByProxy = computed<ISortByOption>({
  get() {
    return props.sortBy;
  },
  set(val: ISortByOption) {
    emit('update:sortBy', val);
  },
});

const flipGrouped = () => {
  emit('update:grouped', !props.grouped);
};

const searchProxy = computed<string>({
  get() {
    return props.search;
  },
  set(val: string) {
    emit('update:search', val);
  },
});

const addBook = () => {
  emit('addBook');
};
</script>
