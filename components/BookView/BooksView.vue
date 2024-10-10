<template>
  <div ref="scrollRoot" class="flex h-full w-full flex-col overflow-y-auto px-2 pr-4">
    <ViewControls class="sticky top-0 z-10 bg-neutral-50 pt-2 dark:bg-neutral-950" />

    <!--When looking at All Books and we have zero books show placeholder-->
    <EmptyBooksPlaceholder v-if="files.length === 0 && !loading" />

    <div v-else class="h-4">
      <TableRender :files="files"></TableRender>
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
import { getFilesByPath, getFilesByTag, type IBookFromDb } from '~/api/watcher/metaCache';
import { useApiEventListener } from '~/api/events';
import { useFilesList } from './useFileList';
import TableRender from './TableRender.vue';

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

const { files, loading } = useFilesList(props.opened, () => setScrollPositionFromSaved());

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
  if (!store.settings) return files.value;
  const sortFunction = getSortFunction(props.opened.settings.sortBy, store.settings?.dateFormat);

  return [...files.value].sort((a, b) => {
    return sortFunction(a, b, props.opened.settings.sortDirection);
  });
});

//
// Scroll position
//

const scrollRoot = useTemplateRef('scrollRoot');

onMounted(() => {
  console.log(scrollRoot.value);
});

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
</style>
