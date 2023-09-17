<template>
  <div class="flex h-full w-full flex-col px-2 py-2">
    <ViewConrols class="" />

    <!--Table Header -->
    <div
      ref="scrollRoot"
      class="box-border border border-neutral-400 dark:border-neutral-900 rounded-md h-full w-full items-start overflow-x-hidden overflow-y-scroll"
    >
      <div
        v-if="opened.settings.viewStyle === 'Lines'"
        class="grid grid-cols-5 gap-5 font-semibold py-1 px-3"
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
            <BookItem
              v-for="item in group.content"
              :key="item.path"
              :current-file="item"
              :draggable="true"
              :view-style="opened.settings.viewStyle"
              :observer="elementObserver"
              @dragstart="startDrag($event, item)"
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
        :class="opened.settings.viewStyle === 'Lines' ? 'grid-cols-1' : 'cards gap-4'"
      >
        <BookItem
          v-for="item in sortedFiles"
          :key="item.path"
          :current-file="item"
          :draggable="true"
          :view-style="opened.settings.viewStyle"
          :observer="elementObserver"
          @dragstart="startDrag($event, item)"
        />
      </div>
    </div>
  </div>
  <div ref="forDrag" class="absolute top-[-50px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
  nextTick,
  onBeforeMount,
} from 'vue';
import Fuse from 'fuse.js';
import { useStore } from '/@/use/store';

import { debounce as _debounce } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import getSortFunction from './getSortFunction';
import { groupItems } from './groupItems';
import ElObserver from './elementObserver';
import { trpcApi } from '/@/utils/trpc';

import BookItem from './BookItem.vue';
import DragDisplay from '../_UI/DragDisplay.vue';
import Rating from '../Rating/RatingStars.vue';
import ViewConrols from './ViewConrols.vue';

import type { IFile, IFiles } from '/@main/services/files';
import type { PropType } from 'vue';
import type { IOpenedPath, IOpenedTag } from '/@main/services/openedTabs';

const store = useStore();

const files = ref<IFiles>({});
const forDrag = ref();

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
  if (props.opened.type === 'folder') {
    files.value = await trpcApi.loadFilesFromFolder.query({
      path: props.opened.thing,
      recursive: props.opened.recursive,
    });
  }
  if (props.opened.type === 'tag') {
    files.value = await trpcApi.loadFilesFromTag.query(props.opened.thing);
  }
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

const u = trpcApi.fileUpdate.subscribe(undefined, {
  onData: updateHandlerApi,
});

const a = trpcApi.fileAdd.subscribe(undefined, {
  onData: addHandlerApi,
});

const r = trpcApi.fileRemove.subscribe(undefined, {
  onData: removeHandlerApi,
});

onUnmounted(async () => {
  u.unsubscribe();
  a.unsubscribe();
  r.unsubscribe();
});

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
  if (!store.settings) return [];
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
// Drag & drop
//
const dragging = ref('');
const startDrag = (devt: DragEvent, file: IFile) => {
  if (devt.dataTransfer === null || !file) {
    return;
  }

  devt.dataTransfer.setData('type', 'file');

  devt.dataTransfer.setData('itemPath', file.path);
  devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  dragging.value = file.name;

  if (!store.openedTabs) return;
  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if (opened.type === 'file' && opened.thing === file.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};

//
// Observer for lazy loading
//
const scrollRoot = ref<HTMLElement>();

let elementObserver = ref<ElObserver>();

onBeforeMount(() => {
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
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  grid-auto-rows: max-content;
}
</style>
