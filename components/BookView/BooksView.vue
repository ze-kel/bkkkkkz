<template>
  <div v-bind="containerProps" class="gutter-stable relative h-full w-full px-2 pr-4">
    <div v-bind="wrapperProps">
      <ViewControls class="sticky top-0 z-10 bg-neutral-50 pt-2 dark:bg-neutral-950" />

      <EmptyBooksPlaceholder v-if="books.length === 0 && !loading" class="mt-40" />

      <div
        v-for="file in list"
        :key="file.index"
        class="gap-4 border-b border-neutral-200 p-4 transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
      >
        <BookViewBookContextMenu :path="file.data.path">
          <div class="flex flex-row justify-between">
            <div class="w-[60%] truncate">
              <template v-if="file.data.attrs.title.Text">
                {{ file.data.attrs.title.Text }}
              </template>
              <template v-else> Unknown title </template>
            </div>
            <div class="w-[20%]">
              {{ file.data.attrs.author.Text }}
            </div>
            <div class="w-[20%]">
              {{ file.data.attrs.year.Number }}
            </div>
          </div>
        </BookViewBookContextMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js';

import { debounce as _debounce } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import getSortFunction from './getSortFunction';
import { groupItems } from './groupItems';

import ViewControls from './ViewControls.vue';

import type { PropType } from 'vue';
import type { IOpenedPath, IOpenedTag } from '~/api/openedTabs';
import EmptyBooksPlaceholder from '~/components/Placeholders/EmptyBooksPlaceholder.vue';
import { useFilesList } from './useFileList';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { useVirtualList } from '@vueuse/core';

const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedPath | IOpenedTag>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const { data, loading } = useFilesList(props.opened, () => setScrollPositionFromSaved());

const books = computed(() => data.value?.books || []);

//
// Search
//

const searchQuery = ref('');
watch(
  () => props.opened.settings.searchQuery,
  _debounce(() => {
    searchQuery.value = props.opened.settings.searchQuery;
  }, 250),
);

//
// Sort
//

const sortedFiles = computed(() => {
  if (!store.settings) return books.value;
  const sortFunction = getSortFunction(props.opened.settings.sortBy, store.settings?.dateFormat);

  return [...books.value].sort((a, b) => {
    return sortFunction(a, b, props.opened.settings.sortDirection);
  });
});

//
// Scroll position
//

const { list, containerProps, wrapperProps } = useVirtualList(sortedFiles, { itemHeight: 59 });

const scrollRoot = containerProps.ref;

const setScrollPositionFromSaved = () => {
  if (!scrollRoot.value) return;
  scrollRoot.value.scrollTop = props.opened.scrollPosition;
};

const saveScrollPos = () => {
  if (!scrollRoot.value) return;
  store.saveScrollPosition(props.index, scrollRoot.value.scrollTop);
};

onMounted(() => {
  if (!scrollRoot.value) return;
  scrollRoot.value.addEventListener('scroll', saveScrollPos);
});

onUnmounted(() => {
  if (!scrollRoot.value) return;
  scrollRoot.value.removeEventListener('scroll', saveScrollPos);
});
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  grid-auto-rows: max-content;
}

.gutter-stable {
  scrollbar-gutter: stable;
  overflow-y: scroll !important;
}
</style>
