<template>
  <div class="h-full w-full flex flex-col">
    <ViewConrols class="border-b border-neutral-300 dark:border-neutral-600" />

    <div
      v-if="opened.settings.viewStyle === 'Lines'"
      class="grid grid-cols-5 gap-5 px-3 font-semibold border-b border-neutral-300 dark:border-neutral-600"
    >
      <div class="border-r border-neutral-300 dark:border-neutral-600 py-1">Title</div>
      <div class="border-r border-neutral-300 dark:border-neutral-600 py-1">Author</div>
      <div class="border-r border-neutral-300 dark:border-neutral-600 py-1">Year</div>
      <div class="border-r border-neutral-300 dark:border-neutral-600 py-1">Read</div>
      <div class="py-1">Rating</div>
    </div>

    <div
      ref="scrollRoot"
      class="w-full h-full box-border overflow-y-auto overflow-x-hidden px-2 items-start py-2"
    >
      <div v-if="opened.settings.grouped">
        <div v-for="group in groupedFiles" :key="group.label" class="mt-4 first:mt-0">
          <div
            class="text-4xl font-mono inline-block pl-1 pr-3 font-medium text-neutral-800 dark:text-neutral-100 mb-1"
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
              :settings="opened.settings"
              :observer="elementObserver"
              @dragstart="startDrag($event, item)"
              @click.right="(e) => openContextMenu(e, item)"
            />
          </div>
        </div>
      </div>

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
          :settings="opened.settings"
          :observer="elementObserver"
          @dragstart="startDrag($event, item)"
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
import { computed, onMounted, onUnmounted, ref, watch, watchEffect, nextTick } from 'vue';
import Fuse from 'fuse.js';
import { useElectron } from '/@/use/electron';
import { useStore } from '/@/use/store';
import { openMenu } from '/@/use/contextMenu';

import _debounce from 'lodash-es/debounce';
import _cloneDeep from 'lodash-es/cloneDeep';
import getSortFunction from './getSortFunction';
import { groupItems } from './groupItems';
import ElObserver from './elementObserver';

import BookItem from './BookItem.vue';
import DragDisplay from '../_UI/DragDisplay.vue';
import Rating from '../Rating/Rating.vue';
import ViewConrols from './ViewConrols.vue';

import type { IFile, IFiles } from '/@main/services/files';
import type { PropType } from 'vue';
import type { IOpenedTag, IOpenedPath, IOpenedFile } from '/@main/watcher/openedTabs';
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

const loadContent = async () => {
  if (props.opened.type === 'folder') {
    files.value = await api.files.loadFilesFromFolder(props.opened.thing, props.opened.recursive);
  }
  if (props.opened.type === 'tag') {
    files.value = await api.files.loadFilesFromTag(props.opened.thing);
  }
  nextTick(setScrollPositionFromSaved);
};

loadContent();

//
// Update event handling
//
const updateHandlerApi = (file: IFile, indexes: number[]) => {
  if (!indexes.includes(props.index)) return;
  if (files.value[file.path]) {
    files.value[file.path] = file;
  }
};

const addHandlerApi = (file: IFile, indexes: number[]) => {
  if (!indexes.includes(props.index)) return;
  files.value[file.path] = file;
};

const removeHandlerApi = (path: string, indexes: number[]) => {
  if (!indexes.includes(props.index)) return;
  if (files.value[path]) {
    delete files.value[path];
  }
};

const toClear: Array<() => void> = [];

toClear.push(
  api.subscriptions.FILE_UPDATE(updateHandlerApi),
  api.subscriptions.FILE_ADD(addHandlerApi),
  api.subscriptions.FILE_REMOVE(removeHandlerApi),
);

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
  const sortFunction = getSortFunction(props.opened.settings.sortBy);

  return [...filteredFiles.value].sort((a, b) => {
    return sortFunction(a, b, props.opened.settings.sortDirection);
  });
});

//
// Grouping
//
const groupedFiles = computed(() => {
  return groupItems(sortedFiles.value, props.opened.settings.sortBy);
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

  const toUpdateIndexes = store.opened.reduce((acc: number[], opened, index) => {
    if (opened.type === 'file' && opened.thing === file.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
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
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  grid-auto-rows: max-content;
}
</style>
