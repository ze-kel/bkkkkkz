<template>
  <div ref="scrollRoot" class="flex h-full w-full flex-col overflow-y-scroll px-2 pb-4">
    <ViewConrols class="sticky top-0 z-10 bg-neutral-50 pt-2 dark:bg-neutral-950" />

    <!--When looking at All Books and we have zero books show placeholder-->
    <EmptyBooksPlaceholder v-if="Object.values(files).length === 0 && !loading" />

    <div
      :class="[
        'box-border w-full items-start rounded-md border',
        opened.settings.viewStyle === 'Lines'
          ? 'border-neutral-400 dark:border-neutral-800'
          : 'border-transparent',
      ]"
    >
      <!--Table Header -->
      <div
        v-if="opened.settings.viewStyle === 'Lines'"
        class="grid grid-cols-5 gap-5 px-3 py-1 font-semibold"
      >
        <div class="">Title</div>
        <div class="">Author</div>
        <div class="">Year</div>
        <div class="">Read</div>
        <div class="py-1">Rating</div>
      </div>

      <!--Grouped case -->
      <div v-if="opened.settings.grouped">
        <div v-for="group in groupedFiles" :key="group.label" class="mt-4 first:mt-0">
          <div
            class="mb-1 inline-block pl-1 pr-3 font-mono text-4xl font-medium text-neutral-800 dark:text-neutral-100"
          >
            <Rating
              v-if="opened.settings.sortBy === 'Rating' && !Number.isNaN(Number(group.label))"
              :model-value="Number(group.label)"
              class="py-1"
              :disabled="true"
            />
            <template v-else>{{ group.label }} </template>
          </div>

          <div
            class="grid"
            :class="opened.settings.viewStyle === 'Lines' ? 'grid-cols-1' : 'cards gap-4'"
          >
            zzzzzzzzz
            <BookItem
              v-for="item in group.content"
              :key="item.path"
              :current-file="item"
              :view-style="opened.settings.viewStyle"
              :observer="elementObserver"
            />
          </div>
        </div>
      </div>
      <!--Regular case -->
      <div
        v-else
        tag="div"
        name="list"
        class="grid"
        :class="opened.settings.viewStyle === 'Lines' ? 'grid-cols-1' : 'cards gap-3'"
      >
        <BookItem
          v-for="item in sortedFiles"
          :key="item.path"
          :current-file="item"
          :view-style="opened.settings.viewStyle"
          :observer="elementObserver"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect, nextTick } from 'vue';
import Fuse from 'fuse.js';
import { useStore } from '~~/utils/store';

import { debounce as _debounce } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import getSortFunction from './getSortFunction';
import { groupItems } from './groupItems';
import ElObserver from './elementObserver';

import BookItem from './BookItemWrapper.vue';
import Rating from '../Rating/RatingStars.vue';
import ViewConrols from './ViewConrols.vue';

import { loadFilesFromFolder, type IFile, type IFiles } from '~/api/files';
import type { PropType } from 'vue';
import type { IOpenedPath, IOpenedTag } from '~/api/openedTabs';
import EmptyBooksPlaceholder from '~/components/Placeholders/EmptyBooksPlaceholder.vue';

const store = useStore();

const files = ref<IFiles>({});

const loading = ref(true);

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

const loadContent = async () => {
  loading.value = true;
  if (props.opened.type === 'folder') {
    files.value = await loadFilesFromFolder({
      basePath: props.opened.thing,
      recursive: props.opened.recursive,
    });
  }
  if (props.opened.type === 'tag') {
    //files.value = await $trpc.loadFilesFromTag.query(props.opened.thing);
  }
  nextTick(() => {
    loading.value = false;
  });
  nextTick(setScrollPositionFromSaved);
};

loadContent();

//
// Update event handling
//
const updateHandlerApi = ({
  file,
  relevantIndexes,
}: {
  file: IFile;
  relevantIndexes: number[];
}) => {
  if (!relevantIndexes.includes(props.index)) return;
  if (files.value[file.path]) {
    files.value[file.path] = file;
  }
};

const addHandlerApi = ({ file, relevantIndexes }: { file: IFile; relevantIndexes: number[] }) => {
  if (!relevantIndexes.includes(props.index)) return;
  files.value[file.path] = file;
};

const removeHandlerApi = ({
  path,
  relevantIndexes,
}: {
  path: string;
  relevantIndexes: number[];
}) => {
  if (!relevantIndexes.includes(props.index)) return;
  if (files.value[path]) {
    delete files.value[path];
  }
};

/*
const u = $trpc.fileUpdate.subscribe(undefined, {
  onData: updateHandlerApi,
});

const a = $trpc.fileAdd.subscribe(undefined, {
  onData: addHandlerApi,
});

const r = $trpc.fileRemove.subscribe(undefined, {
  onData: removeHandlerApi,
});

onUnmounted(async () => {
  u.unsubscribe();
  a.unsubscribe();
  r.unsubscribe();
});
*/

//
// Search
//
const filesArray = computed<IFile[]>(() => {
  return Object.values(files.value);
});

const collectionIndex = ref(-1);
const fuse = new Fuse<IFile>(filesArray.value, {
  keys: ['name', 'title', 'author', 'year'],
  threshold: 0.2,
});

watchEffect(() => {
  fuse.setCollection(filesArray.value);
  collectionIndex.value++;
});

const searchQuery = ref('');
watch(
  () => props.opened.settings.searchQuery,
  _debounce(() => {
    searchQuery.value = props.opened.settings.searchQuery;
  }, 250),
);

const filteredFiles = computed(() => {
  // This is a way to force update computed when we do fuse.setCollection, which is not reactive by itself
  if (collectionIndex.value < 0) return [];

  if (!props.opened.settings.searchQuery) return filesArray.value;
  const res = fuse.search(props.opened.settings.searchQuery);
  return res.map((el) => el.item);
});

//
// Sort
//
const sortedFiles = computed(() => {
  if (!store.settings) return filteredFiles.value;
  const sortFunction = getSortFunction(props.opened.settings.sortBy, store.settings?.dateFormat);

  return [...filteredFiles.value].sort((a, b) => {
    return sortFunction(a, b, props.opened.settings.sortDirection);
  });
});

//
// Grouping
//
const groupedFiles = computed(() => {
  if (!store.settings) return [];
  return groupItems(sortedFiles.value, props.opened.settings.sortBy, store.settings?.dateFormat);
});

//
// Observer for lazy loading
//
const scrollRoot = ref<HTMLElement>();

let elementObserver = ref<ElObserver>();

onMounted(() => {
  if (!scrollRoot.value) return;
  elementObserver.value = new ElObserver(scrollRoot.value);
});

onUnmounted(() => {
  if (!scrollRoot.value) return;
  elementObserver.value?.destroy(scrollRoot.value);
});

//
// Scroll position
//
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
