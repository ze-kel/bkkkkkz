<template>
  <div v-if="file" class="flex flex-col h-full p-5">
    <div class="flex gap-4">
      <div class="flex-grow">
        <ContentEditable
          v-model="authorProxy"
          spellcheck="false"
          tag="div"
          class="text-2xl w-fit input-default"
        />
        <ContentEditable
          v-model="titleProxy"
          spellcheck="false"
          tag="div"
          class="text-xl mt-1 w-fit input-default"
        />

        <ContentEditable
          v-model="pathProxy"
          spellcheck="false"
          tag="div"
          class="text-m mt-1 w-fit input-default"
        />
      </div>

      <div>
        <ReadDetails v-model="readProxy" />
        <Rating v-model="ratingProxy" class="mt-2" />
        <Tags v-model="tagsProxy" class="mt-2" />
      </div>
    </div>
    <hr class="hr-default my-4" />
    <div class="h-full">
      <Milkdown :text="file.content" @update="updateMarkdown" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  getCurrentInstance,
  computed,
  onBeforeUnmount,
  ref,
  onMounted,
  watchEffect,
  onUnmounted,
} from 'vue';
import type { PropType } from 'vue';
import type { IFile, ISavedFile } from '/@main/services/files';
import ContentEditable from 'vue-contenteditable';
import ReadDetails from '../ReadDetails/ReadDetails.vue';
import Rating from '../Rating/Rating.vue';
import type { IDateRead } from '/@main/services/books';
import Milkdown from './Mikdown.vue';
import Tags from '../Tags/Tags.vue';
import type { IOpenedFile } from '/@main/services/watcher';
import _debounce from 'lodash-es/debounce';
import { useElectron } from '/@/use/electron';

import { cloneDeep } from 'lodash';
import { useStore } from '/@/use/store';

const internalInstance = getCurrentInstance();
const api = useElectron();
const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const file = ref<ISavedFile | null>(null);

const save = (file: ISavedFile) => {
  api.files.saveFileContent(cloneDeep(file));
};

const rename = async (newName: string) => {
  if (!file.value) return;
  const newPath = await api.files.rename(file.value?.path, newName);
  store.updateOpened(props.index, { type: 'file', thing: newPath });
};

const debouncedSave = _debounce(save, 500);
const debouncedRename = _debounce(rename, 500);

const updateHandlerApi = (path: string, newFile: IFile) => {
  file.value = newFile;
};

watchEffect(async () => {
  file.value = await api.files.loadFileContent(props.opened.thing);
});

const toClear: Array<() => void> = [];

onMounted(() => {
  toClear.push(api.subscriptions.FILE_UPDATE(updateHandlerApi));
  toClear.push(api.subscriptions.FILE_REMOVE(() => store.closeOpened(props.index)));
});

onUnmounted(() => {
  toClear.forEach((fn) => fn());
});

const emit = defineEmits<{
  (e: 'update', file: IFile): void;
}>();

const titleProxy = computed({
  get: () => file.value?.title,
  set: (val) => {
    if (!file.value) return;
    file.value.title = val;
    debouncedSave(file.value);
  },
});

const authorProxy = computed({
  get: () => file.value?.author,
  set: (val) => {
    if (!file.value) return;
    file.value.author = val;
    debouncedSave(file.value);
  },
});

const ratingProxy = computed({
  get: () => file.value?.myRating || 0,
  set: (val) => {
    if (!file.value) return;
    file.value.myRating = val;
    debouncedSave(file.value);
  },
});

const readProxy = computed({
  get: () => file.value?.read,
  set: (val) => {
    if (!file.value) return;
    file.value.read = val;
    debouncedSave(file.value);
  },
});

const tagsProxy = computed({
  get: () => file.value?.tags,
  set: (val) => {
    if (!file.value) return;
    file.value.tags = val;
    debouncedSave(file.value);
  },
});

const pathProxy = computed({
  get: () => file.value?.name,
  set: (val) => {
    if (!val) return;
    debouncedRename(val);
  },
});

const updateMarkdown = (val: string) => {
  if (!file.value) return;
  file.value.content = val;
  debouncedSave(file.value);
};

onBeforeUnmount(() => {
  // If you have contenteditable focused when closing editor it will cause error in console.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});
</script>

<style scoped></style>
