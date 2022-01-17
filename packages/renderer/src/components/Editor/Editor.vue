<template>
  <div v-if="!loading" class="flex flex-col h-full px-5">
    <div class="flex gap-4">
      <div>
        <Cover v-bind="file" class="aspect-[6/8] max-h-60" @click.right="coverRightClick" />
      </div>
      <div class="flex-grow">
        <ContentEditable
          v-model="file.author"
          spellcheck="false"
          tag="div"
          class="text-2xl w-fit min-w-[100px] input-default"
          placeholder="Author"
          :placeholder-classes="'text-gray-400 hover:text-gray-600'"
        />
        <ContentEditable
          v-model="file.title"
          spellcheck="false"
          tag="div"
          class="text-xl mt-1 w-fit min-w-[100px] input-default"
          placeholder="Title"
          :placeholder-classes="'text-gray-400 hover:text-gray-600'"
        />
        <ContentEditable
          v-model="file.year"
          spellcheck="false"
          tag="div"
          class="text-md mt-1 w-fit min-w-[75px] input-default"
          placeholder="Year"
          :placeholder-classes="'text-gray-400 hover:text-gray-600'"
        />

        <div class="flex items-center mt-2">
          <div :draggable="true" @dragstart="startDrag($event)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="cursor-move fill-gray-600"
            >
              <path
                d="M18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2H13C13.0109 2.00047 13.0217 2.00249 13.032 2.006C13.0418 2.00902 13.0518 2.01103 13.062 2.012C13.1502 2.01765 13.2373 2.0348 13.321 2.063L13.349 2.072C13.3717 2.07968 13.3937 2.08904 13.415 2.1C13.5239 2.14842 13.6232 2.21618 13.708 2.3L19.708 8.3C19.7918 8.38479 19.8596 8.48406 19.908 8.593C19.918 8.615 19.925 8.638 19.933 8.661L19.942 8.687C19.9699 8.77039 19.9864 8.85718 19.991 8.945C19.9926 8.95418 19.9949 8.96322 19.998 8.972C19.9998 8.98122 20.0004 8.99062 20.0001 9V20C20.0001 21.1046 19.1046 22 18 22ZM6 4V20H18V10H13C12.4477 10 12 9.55228 12 9V4H6ZM14 5.414V8H16.586L14 5.414Z"
              />
            </svg>
          </div>

          <ContentEditable
            v-model="file.name"
            spellcheck="false"
            tag="div"
            class="text-m ml-1 w-fit min-w-[100px] input-default"
            placeholder="Filename"
            :placeholder-classes="'text-gray-400 hover:text-gray-600'"
          />

          <button
            v-if="!autoSave"
            class="bg-indigo-600 hover:bg-indigo-800 text-white px-3 py-1 ml-3 rounded-md transition-colors"
            @click="manualSave"
          >
            Save
          </button>
        </div>
      </div>

      <div class="w-[33%]">
        <ReadDetails v-model="file.read" />
        <Rating v-model="file.myRating" class="mt-2" />
        <Tags v-model="file.tags" class="mt-2" />
      </div>
    </div>
    <hr class="hr-default my-4" />

    <div class="h-full">
      <Milkdown v-model="file.content" />
    </div>
  </div>
  <div ref="forDrag" class="absolute top-[-50px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watchEffect, onUnmounted, watch } from 'vue';
import { useStore } from '/@/use/store';
import { useElectron } from '/@/use/electron';
import { openMenu } from '/@/use/contextMenu';

import ContentEditable from '../_UI/ContentEditable.vue';
import ReadDetails from '../ReadDetails/ReadDetails.vue';
import Rating from '../Rating/Rating.vue';
import Milkdown from './Mikdown.vue';
import Tags from '../Tags/Tags.vue';
import DragDisplay from '/@/components/_UI/DragDisplay.vue';
import Cover from '/@/components/Cover/Cover.vue';

import _cloneDeep from 'lodash-es/cloneDeep';
import _debounce from 'lodash-es/debounce';

import type { PropType } from 'vue';
import type { IFile, ISavedFile, IUnsavedFile } from '/@main/services/files';
import type { IOpenedFile, IOpenedNewFile } from '/@main/services/watcher';
import type { ContextMenu } from '/@/use/contextMenu';

const api = useElectron();
const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile | IOpenedNewFile>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const file = ref<ISavedFile | IUnsavedFile>({ unsaved: true, name: '' });
const previousName = ref('');
const autoSave = ref(false);
const loading = ref(true);

watchEffect(async () => {
  if (props.opened.type === 'file') {
    loading.value = true;
    const res = await api.files.loadFileContent(props.opened.thing);
    previousName.value = res.name || '';
    file.value = res;
    autoSave.value = true;
    loading.value = false;
  } else {
    autoSave.value = false;
    loading.value = false;
  }
});

const manualSave = async () => {
  if ('unsaved' in file.value) {
    const { unsaved, ...restProps } = file.value;
    const toBeSaved: ISavedFile = {
      ...restProps,
      path: props.opened.thing + '/' + file.value.name,
    };
    await api.files.saveFileContent(_cloneDeep(toBeSaved));
    store.updateOpened(props.index, {
      type: 'file',
      thing: toBeSaved.path,
    });
    autoSave.value = true;
  } else {
    save(file.value);
  }
};

const save = (file: ISavedFile) => {
  api.files.saveFileContent(_cloneDeep(file));
};

const rename = async (newName: string) => {
  if (!file.value || 'unsaved' in file.value) return;
  const newPath = await api.files.rename(file.value?.path, newName);
  store.updateOpened(props.index, { type: 'file', thing: newPath });
};

const debouncedSave = _debounce(save, 500);
const debouncedRename = _debounce(rename, 500);

watch(
  file,
  (newFile, oldFile) => {
    if (!oldFile || !newFile || !autoSave.value || 'unsaved' in newFile) return;

    // Can't check against oldFile because after mutation it will be the same
    // OldFile is still useful to eliminate initial load case
    if (newFile.name !== previousName.value) {
      debouncedRename(newFile.name);
    } else {
      debouncedSave(newFile);
    }
  },
  { deep: true },
);

//
// Update events handling
//
const updateHandlerApi = (path: string, newFile: IFile) => {
  file.value = newFile;
};
const toClear: Array<() => void> = [];

const registerHandles = () => {
  toClear.push(api.subscriptions.FILE_UPDATE(updateHandlerApi));
  toClear.push(api.subscriptions.FILE_REMOVE(() => store.closeOpened(props.index)));
};

onMounted(() => {
  registerHandles();
});

onUnmounted(() => {
  toClear.forEach((fn) => fn());
});

//
// File drag & drop
//
const dragging = ref('');
const forDrag = ref();
const startDrag = (devt: DragEvent) => {
  if (devt.dataTransfer === null || !file.value || 'unsaved' in file.value) {
    return;
  }

  devt.dataTransfer.setData('itemPath', file.value.path);
  devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  dragging.value = file.value.name;

  const toUpdateIndexes = store.opened.reduce((acc: number[], opened, index) => {
    if ('unsaved' in file.value) return [];
    if (opened.type === 'file' && opened.thing === file.value?.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};

///
/// Cover Right click
///
const removeCover = () => {
  if ('unsaved' in file.value) return;
  api.files.removeCoverFile(file.value.path);
};

const setCover = () => {
  if ('unsaved' in file.value) return;
  api.files.setCover(file.value.path);
};

const coverRightClick = (e: MouseEvent) => {
  const menu: ContextMenu = [];

  if ('unsaved' in file.value) return;

  if (file.value.cover) {
    menu.push(
      {
        handler: setCover,
        label: 'Change Cover',
      },
      {
        handler: removeCover,
        label: 'Remove Cover',
      },
    );
  } else {
    menu.push({
      handler: setCover,
      label: 'Add Cover',
    });
  }

  openMenu(menu, e.x, e.y);
};
</script>

<style scoped></style>
