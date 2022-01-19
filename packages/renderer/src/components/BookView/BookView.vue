<template>
  <div ref="rootElement" class="h-full w-full flex flex-col">
    <div class="px-2 flex gap-2 items-stretch justify-between">
      <div class="flex gap-2 w-3/12">
        <input
          v-model="searchQueryPreDebounce"
          class="px-2 py-1 border-2 rounded-md border-indigo-200 focus:outline-none focus:border-indigo-600 focus:shadow-indigo-400 transition-colors"
          placeholder="Search Books"
        />
        <button
          v-if="opened.type === 'path'"
          class="basic-button h-full w-fit whitespace-nowrap"
          @click="addBook"
        >
          Add book
        </button>
      </div>

      <div class="flex w-fit">
        <div
          class="group p-1 hover:bg-gray-800 cursor-pointer transition-colors rounded-md aspect-square h-full flex items-center justify-center mr-2"
          @click="flipGrouped"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            class="transition-colors"
            :class="
              doGroup
                ? ['fill-indigo-600', 'group-hover:fill-indigo-400']
                : ['fill-gray-800', 'group-hover:fill-white']
            "
          >
            <path d="M21 19H3V17H21V19ZM10 15H3V13H10V15ZM21 11H3V9H21V11ZM10 7H3V5H10V7Z" />
          </svg>
        </div>

        <select v-model="sortBy">
          <option v-for="item in canSortby" :key="item">{{ item }}</option>
        </select>

        <div
          class="group p-1 hover:bg-gray-800 cursor-pointer transition-colors rounded-md aspect-square h-full flex items-center justify-center ml-2"
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
    <div class="w-full px-2 z-10 h-0">
      <div class="w-full h-2 bg-gradient-to-b from-white to-transparent"></div>
    </div>
    <div class="w-full h-full box-border overflow-y-auto overflow-x-hidden px-2 items-start pt-2">
      <div v-if="doGroup">
        <div v-for="group in groupedFiles" :key="group.label" class="mt-4 first:mt-0">
          <div class="text-2xl font-medium text-gray-800">
            <Rating
              v-if="sortBy === 'Rating' && !Number.isNaN(Number(group.label))"
              :model-value="Number(group.label)"
              class="py-1"
              :disabled="true"
            ></Rating>
            <template v-else>{{ group.label }} </template>
          </div>
          <hr class="hr-default mb-2" />
          <div class="grid cards gap-4">
            <BookItem
              v-for="item in group.content"
              :key="item.path"
              :current-file="item"
              :style="'CARDS'"
              :draggable="true"
              @dragstart="startDrag($event, item)"
              @open="(newTab) => openHandler(item, newTab)"
              @click.right="(e) => openContextMenu(e, item)"
            />
          </div>
        </div>
      </div>

      <div v-if="!doGroup" tag="div" name="list" class="grid cards gap-4">
        <BookItem
          v-for="item in sortedFiles"
          :key="item.path"
          :current-file="item"
          :style="'CARDS'"
          :draggable="true"
          @dragstart="startDrag($event, item)"
          @open="(newTab) => openHandler(item, newTab)"
          @click.right="(e) => openContextMenu(e, item)"
        />
      </div>
    </div>
  </div>
  <div ref="forDrag" class="absolute top-[-50px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import Fuse from 'fuse.js';
import { useElectron } from '/@/use/electron';
import { useStore } from '/@/use/store';
import { openMenu } from '/@/use/contextMenu';

import _debounce from 'lodash-es/debounce';
import _cloneDeep from 'lodash-es/cloneDeep';
import getSortFunction from './getSortFunction';
import { groupItems } from './groupItems';

import BookItem from './BookItem/BookItem.vue';
import DragDisplay from '../_UI/DragDisplay.vue';
import Rating from '../Rating/Rating.vue';

import type { IFile, IFiles } from '/@main/services/files';
import type { PropType } from 'vue';
import type { IOpenedTag, IOpenedPath, IOpenedFile } from '/@main/services/watcher';
import type { ISortByOption, ISortDirection } from './getSortFunction';
import type { ContextMenu } from '/@/use/contextMenu';

const api = useElectron();

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

watchEffect(async () => {
  if (props.opened.type === 'path') {
    files.value = await api.files.loadFilesFromFolder(props.opened.thing, props.opened.recursive);
  }
  if (props.opened.type === 'tag') {
    files.value = await api.files.loadFilesFromTag(props.opened.thing);
  }
});

const openHandler = (file: IFile, newTab = false) => {
  const newOpened: IOpenedFile = { type: 'file', thing: file.path };
  if (newTab) {
    store.addOpened(newOpened);
  } else {
    store.updateOpened(props.index, newOpened);
  }
};

//
// Update event handling
//
const updateHandlerApi = (path: string, content: IFile, indexes: number[]) => {
  if (!indexes.includes(props.index)) return;
  if (files.value[path]) {
    files.value[path] = content;
  }
};

const addHandlerApi = (path: string, content: IFile, indexes: number[]) => {
  if (!indexes.includes(props.index)) return;
  files.value[path] = content;
};

const removeHandlerApi = (path: string, indexes: number[]) => {
  if (!indexes.includes(props.index)) return;
  if (files.value[path]) {
    delete files.value[path];
  }
};

const toClear: Array<() => void> = [];

onMounted(async () => {
  toClear.push(
    api.subscriptions.FILE_UPDATE(updateHandlerApi),
    api.subscriptions.FILE_ADD(addHandlerApi),
    api.subscriptions.FILE_REMOVE(removeHandlerApi),
  );
});

onUnmounted(async () => {
  toClear.forEach((fn) => fn());
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

const searchQueryPreDebounce = ref('');
const searchQuery = ref('');
watch(
  searchQueryPreDebounce,
  _debounce(() => {
    searchQuery.value = searchQueryPreDebounce.value;
  }, 250),
);

const filteredFiles = computed(() => {
  // This is a way to force update computed when we do fuse.setCollection, which is not reactive by itself
  if (collectionIndex.value < 0) return [];

  if (!searchQuery.value) return filesArray.value;
  const res = fuse.search(searchQuery.value);
  return res.map((el) => el.item);
});

//
// Sort
//

const canSortby: ISortByOption[] = [
  'Author',
  'Title',
  'Rating',
  'Year',
  'Last Read',
  'First Read',
  'Filename',
];

const sortBy = ref<ISortByOption>('Title');
const sortDirection = ref<ISortDirection>(1);

const flipSortDirection = () => {
  //@ts-expect-error This is correct because -1 * -1 = 1 and vice versa
  sortDirection.value = sortDirection.value * -1;
};

const sortedFiles = computed(() => {
  const sortFunction = getSortFunction(sortBy.value);

  return [...filteredFiles.value].sort((a, b) => sortFunction(a, b, sortDirection.value));
});

//
// Grouping
//

const doGroup = ref(true);
const flipGrouped = () => {
  doGroup.value = !doGroup.value;
};

const groupedFiles = computed(() => {
  if (!doGroup.value) return null;

  return groupItems(sortedFiles.value, sortBy.value);
});

//
// Drag & drop
//
const dragging = ref('');
const startDrag = (devt: DragEvent, file: IFile) => {
  if (devt.dataTransfer === null || !file) {
    return;
  }

  devt.dataTransfer.setData('itemPath', file.path);
  devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  dragging.value = file.name;

  const toUpdateIndexes = store.opened.reduce((acc: number[], opened, index) => {
    if (opened.type === 'file' && opened.thing === file.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};

const addBook = () => {
  store.addOpened({ type: 'newFile', thing: props.opened.thing });
};

//
// Right click
//
const getMenu = (book: IFile): ContextMenu => {
  return [{ label: 'Delete', handler: () => api.files.delete(book.path) }];
};

const openContextMenu = (e: MouseEvent, book: IFile) => {
  openMenu(getMenu(book), e.x, e.y);
};
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  grid-auto-rows: max-content;
}
</style>
