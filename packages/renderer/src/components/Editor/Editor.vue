<template>
  <div class="root">
    <div class="cardWrapper">
      <BookCard
        v-for="item in sortedFiles"
        :key="item.path"
        :current-file="item"
        class="card"
        @update="updateHandler"
        @rename="renameHandler"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import type { PropType } from 'vue';
import BookCard from './BookCard/BookCard.vue';
import { useElectron } from '/@/use/electron';
import _debounce from 'lodash-es/debounce';
import type { ILoadedFile, ILoadedFiles } from '/@main/services/files';

const api = useElectron();

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

const files = ref<ILoadedFiles>({});

watchEffect(async () => {
  console.log('loading recursive is ', props.recursive);
  files.value = await api.files.loadFilesFromFolder(props.openedPath, props.recursive);
});

const updateHandlerApi = (_: Event, path: string, content: ILoadedFile) => {
  console.log('UPDATE HANDLER API', path);
  if (files.value[path]) {
    files.value[path] = content;
  }
};

const addHandlerApi = (_: Event, path: string, content: ILoadedFile) => {
  console.log('ADD HANDLER API', path, content);
  files.value[path] = content;
};

const removeHandlerApi = (_: Event, path: string) => {
  console.log('REMOVE HANDLER API', path);
  if (files.value[path]) {
    delete files.value[path];
  }
};

onMounted(async () => {
  api.files.setFileHandler(updateHandlerApi);
  api.files.setLoadedAddHandler(addHandlerApi);
  api.files.setLoadedRemoveHandler(removeHandlerApi);
});

const sortedFiles = computed(() => {
  console.log('files upd', files.value);
  const arr = Object.values(files.value);

  arr.sort((a, b) => a.name.localeCompare(b.name));

  console.log('sortedFiles upd', arr);

  return arr;
});

const debouncedSave = _debounce(api.files.saveFileContent, 500);
const debouncedRename = _debounce(api.files.rename, 500);

const updateHandler = (path: string, key: keyof ILoadedFile, data: string | number) => {
  if (!files.value[path]) {
    throw "Trying to edit file that isn't loaded";
  }
  // @ts-expect-error Should be safe and has no possible way to type properly
  files.value[path][key] = data;
  const newFile = { ...files.value[path] };
  debouncedSave(newFile);
};

const renameHandler = (path: string, newName: string) => {
  if (!files.value[path]) {
    throw "Trying to rename file that isn't loaded";
  }
  debouncedRename(path, newName);
};
</script>

<style lang="scss" scoped>
.root {
  overflow-y: scroll;
  display: flex;
  flex-grow: 4;
  flex-direction: column;
  padding: 20px 20px;
}

.cardWrapper {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 15px;
  .card:not(:first-child) {
    margin-top: 15px;
  }
}
</style>
