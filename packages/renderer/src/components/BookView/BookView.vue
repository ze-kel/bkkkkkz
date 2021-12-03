<template>
  <div ref="rootElement" class="bookViewRoot">
    <input v-model="searchQueryPreDebounce" class="search" placeholder="Search Books" />
    <div class="cardWrapper" :style="cardWrapperStyle">
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
import {
  computed,
  getCurrentInstance,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUpdated,
  ref,
  watch,
  watchEffect,
} from 'vue';
import type { PropType } from 'vue';
import BookItem from './BookItem/BookItem.vue';
import Popup from '../_UI/Popup.vue';
import { useElectron } from '/@/use/electron';
import _debounce from 'lodash-es/debounce';
import type { IFile, IFiles, ISavedFile } from '/@main/services/files';
import Fuse from 'fuse.js';

const api = useElectron();
const internalInstance = getCurrentInstance();

const opened = ref(false);

const props = defineProps({
  openedPath: {
    type: String as PropType<string>,
    required: true,
  },
  recursive: {
    type: Boolean,
    default: false,
  },
});

const files = ref<IFiles>({});

watchEffect(async () => {
  files.value = await api.files.loadFilesFromFolder(props.openedPath, props.recursive);
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

const updateHandler = (file: IFile) => {
  if (!files.value[file.path]) {
    throw "Trying to edit file that isn't loaded";
  }
  files.value[file.path] = file;
  const newFile = { ...files.value[file.path] };
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
      numberOfColumns.value = Math.floor(rootElement.value.clientWidth / 280);
    }
  };

  updateNumberOfColumns();

  if (rootElement.value) {
    new ResizeObserver(updateNumberOfColumns).observe(rootElement.value);
  }
});
const cardWrapperStyle = computed(() => {
  return { gridTemplateColumns: `repeat(${numberOfColumns.value}, 1fr)` };
});
</script>

<style lang="scss" scoped>
.bookViewRoot {
  overflow-y: scroll;
  display: flex;
  flex-grow: 4;
  flex-direction: column;
  padding: 20px 20px;
}

.search {
  padding: 7px 12px;
}

.cardWrapper {
  display: grid;
  grid-gap: 15px;
}
</style>
