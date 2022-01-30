<template>
  <div class="px-2 flex gap-2 items-center justify-between">
    <div class="flex gap-2 w-3/12 py-2">
      <input v-model="searchProxy" class="input-default" placeholder="Search Books" />
      <button
        v-if="showAddButton"
        class="basic-button h-full w-fit whitespace-nowrap"
        @click="addBook"
      >
        Add book
      </button>
    </div>

    <div v-if="store.settings" class="flex w-fit">
      <div
        class="group p-1 mr-2"
        :class="store.settings.viewSettings.grouped ? 'basic-button-inverted' : 'basic-button'"
        @click="flipGrouped"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          class="transition-colors"
          :class="
            store.settings.viewSettings.grouped
              ? ['fill-white', 'group-hover:fill-gray-800']
              : ['fill-gray-800', 'group-hover:fill-white']
          "
        >
          <path d="M21 19H3V17H21V19ZM10 15H3V13H10V15ZM21 11H3V9H21V11ZM10 7H3V5H10V7Z" />
        </svg>
      </div>

      <div class="flex border border-gray-300 rounded-sm overflow-hidden mr-2 items-center">
        <div
          class="group p-1 border-0"
          :class="
            store.settings.viewSettings.viewStyle === 'Covers'
              ? 'border-gray-900 bg-gray-900'
              : 'basic-button '
          "
        >
          <svg
            :class="
              store.settings.viewSettings.viewStyle === 'Covers'
                ? ['fill-white']
                : ['fill-gray-800', 'group-hover:fill-white']
            "
            width="24"
            height="24"
            viewBox="0 0 24 24"
            @click="setStyle('Covers')"
          >
            <path
              d="M20 20H16V16H20V20ZM14 20H10V16H14V20ZM8 20H4V16H8V20ZM20 14H16V10H20V14ZM14 14H10V10H14V14ZM8 14H4V10H8V14ZM20 8H16V4H20V8ZM14 8H10V4H14V8ZM8 8H4V4H8V8Z"
            />
          </svg>
        </div>
        <div
          class="group p-1 border-0"
          :class="
            store.settings.viewSettings.viewStyle === 'Lines'
              ? 'border-gray-900 bg-gray-900'
              : 'basic-button '
          "
        >
          <svg
            :class="
              store.settings.viewSettings.viewStyle === 'Lines'
                ? ['fill-white']
                : ['fill-gray-800', 'group-hover:fill-white']
            "
            width="24"
            height="24"
            viewBox="0 0 24 24"
            @click="setStyle('Lines')"
          >
            <path d="M21 18H3V16H21V18ZM21 13H3V11H21V13ZM21 8H3V6H21V8Z" />
          </svg>
        </div>
      </div>

      <select v-model="store.settings.viewSettings.sortBy" class="basic-button">
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
            v-if="store.settings.viewSettings.sortDirection > 0"
            d="M13 5.83L15.59 8.41L17 7L12 2L7 7L8.41 8.41L11 5.83V22H13V5.83Z"
          />
          <path v-else d="M16 18H13V2L11 2V18H8L12 22L16 18Z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed, onUnmounted, onUpdated } from 'vue';
import type { ISortByOption, ISortDirection, IViewStyle } from '/@main/services/settings';
import { useStore } from '/@/use/store';

const props = defineProps({
  search: {
    type: String,
    required: true,
  },
  showAddButton: {
    type: Boolean,
    default: false,
  },
});

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
  //@ts-expect-error this is correct
  store.settings.viewSettings.sortDirection = store.settings?.viewSettings.sortDirection * -1;
};

const flipGrouped = () => {
  if (!store.settings) return;
  store.settings.viewSettings.grouped = !store.settings.viewSettings.grouped;
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

const setStyle = (style: IViewStyle) => {
  if (!store.settings) return;
  store.settings.viewSettings.viewStyle = style;
};

onUnmounted(() => {
  store.saveSettings();
});
</script>
