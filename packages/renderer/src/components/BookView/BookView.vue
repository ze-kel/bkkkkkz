<template>
  <div ref="rootElement" class="h-full w-full flex flex-col pt-4">
    <div class="px-4">
      <input
        v-model="searchQueryPreDebounce"
        class="w-3/12 px-2 py-1 mb-1 border-2 rounded-md border-indigo-200 shadow-md shadow-indigo-100 focus:outline-none focus:border-indigo-600 focus:shadow-indigo-400 transition-colors"
        placeholder="Search Books"
      />
    </div>
    <div
      class="w-full h-full box-border grid cards gap-4 overflow-y-auto overflow-x-hidden px-4 py-2"
    >
      <BookItem
        v-for="item in sortedFiles"
        :key="item.path"
        :current-file="item"
        :style="'CARDS'"
        @update="updateHandler"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch, watchEffect } from 'vue';
import BookItem from './BookItem/BookItem.vue';
import { useElectron } from '/@/use/electron';
import _debounce from 'lodash-es/debounce';
import cloneDeep from 'lodash-es/cloneDeep';
import type { IFile, IFiles } from '/@main/services/files';
import Fuse from 'fuse.js';
import { useStore } from '/@/use/store';

const api = useElectron();
const internalInstance = getCurrentInstance();

const store = useStore();

const files = ref<IFiles>({});

watchEffect(async () => {
  if (!store.opened) {
    files.value = {};
    return;
  }

  if (store.opened.type === 'path') {
    files.value = await api.files.loadFilesFromFolder(store.opened.thing, store.opened.recursive);
  }
  if (store.opened.type === 'tag') {
    files.value = await api.files.loadFilesFromTag(store.opened.thing);
  }
});

const updateHandlerApi = (path: string, content: IFile) => {
  if (files.value[path]) {
    files.value[path] = content;
  }
};

const addHandlerApi = (path: string, content: IFile) => {
  files.value[path] = content;
};

const removeHandlerApi = (path: string) => {
  if (files.value[path]) {
    delete files.value[path];
  }
};

onMounted(async () => {
  api.subscriptions.FILE_UPDATE(updateHandlerApi);
  api.subscriptions.FILE_ADD(addHandlerApi);
  api.subscriptions.FILE_REMOVE(removeHandlerApi);
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
const numberOfColumns = ref(1);
onMounted(async () => {
  const updateNumberOfColumns = () => {
    if (rootElement.value) {
      numberOfColumns.value = Math.floor(rootElement.value.clientWidth / 175);
    }
  };

  updateNumberOfColumns();

  if (rootElement.value) {
    new ResizeObserver(updateNumberOfColumns).observe(rootElement.value);
  }
});
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
}
</style>
