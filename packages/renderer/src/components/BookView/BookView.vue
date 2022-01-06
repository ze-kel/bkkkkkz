<template>
  <div ref="rootElement" class="h-full w-full flex flex-col">
    <div class="px-2 flex gap-2 items-center">
      <input
        v-model="searchQueryPreDebounce"
        class="w-3/12 px-2 py-1 border-2 rounded-md border-indigo-200 focus:outline-none focus:border-indigo-600 focus:shadow-indigo-400 transition-colors"
        placeholder="Search Books"
      />
      <button
        v-if="opened.type === 'path'"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 h-full rounded-md transition-colors"
        @click="addBook"
      >
        Add book
      </button>
    </div>
    <div class="w-full h-full box-border grid cards gap-4 overflow-y-auto overflow-x-hidden p-2">
      <BookItem
        v-for="item in sortedFiles"
        :key="item.path"
        :current-file="item"
        :style="'CARDS'"
        :draggable="true"
        @dragstart="startDrag($event, item)"
        @open="(newTab) => openHandler(item, newTab)"
      />
    </div>
  </div>
  <div ref="forDrag">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import BookItem from './BookItem/BookItem.vue';
import { useElectron } from '/@/use/electron';
import _debounce from 'lodash-es/debounce';
import cloneDeep from 'lodash-es/cloneDeep';
import type { IFile, IFiles } from '/@main/services/files';
import Fuse from 'fuse.js';
import { useStore } from '/@/use/store';
import type { IOpenedTag, IOpenedPath, IOpenedFile } from '/@main/services/watcher';
import type { PropType } from 'vue';
import DragDisplay from '../_UI/DragDisplay.vue';

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

const filesArray = computed(() => {
  return Object.values(files.value);
});

const fuse = new Fuse<IFile>(filesArray.value, {
  keys: ['name', 'title', 'author', 'year'],
  threshold: 0.2,
});
watchEffect(() => {
  fuse.setCollection(filesArray.value);
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
  if (!searchQuery.value) return filesArray.value;
  const res = fuse.search(searchQuery.value);
  return res.map((el) => el.item);
});

const sortedFiles = computed(() => {
  if (searchQuery.value) {
    return filteredFiles.value;
  } else {
    return [...filteredFiles.value].sort((a, b) => a.name.localeCompare(b.name));
  }
});

const debouncedSave = _debounce(api.files.saveFileContent, 500);
const debouncedRename = _debounce(api.files.rename, 500);

const openHandler = (file: IFile, newTab = false) => {
  const newOpened: IOpenedFile = { type: 'file', thing: file.path };
  if (newTab) {
    store.addOpened(newOpened);
  } else {
    store.updateOpened(props.index, newOpened);
  }
};

const updateHandler = async (file: IFile) => {
  if (!files.value[file.path]) {
    throw "Trying to edit file that isn't loaded";
  }
  files.value[file.path] = file;
  const newFile = cloneDeep(files.value[file.path]);
  debouncedSave(newFile);
};

const renameHandler = (path: string, newName: string) => {
  if (!files.value[path]) {
    throw "Trying to rename file that isn't loaded";
  }
  debouncedRename(path, newName);
};

const rootElement = ref<Element | null>(null);

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
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
}
</style>
