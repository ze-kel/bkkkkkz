<template>
  <div v-if="!loading" class="flex flex-col h-full px-5">
    <div class="grid customTopGrid gap-4">
      <div class="" :draggable="true" @dragstart="startDrag($event)">
        <Cover :file="file" class="aspect-[6/8] max-h-60" @click.right="coverRightClick" />
      </div>
      <div class="flex-grow flex flex-col justify-between">
        <div>
          <ContentEditable
            v-model="file.title"
            spellcheck="false"
            tag="div"
            class="text-2xl w-fit min-w-[100px] input-default"
            placeholder="Title"
            :placeholder-classes="'text-gray-400 hover:text-gray-600'"
          />
          <ContentEditable
            v-model="file.author"
            spellcheck="false"
            tag="div"
            class="text-xl w-fit min-w-[100px] input-default font-light"
            placeholder="Author"
            :placeholder-classes="'text-gray-400 hover:text-gray-600'"
          />
          <ContentEditable
            v-model:model-value-number="file.year"
            :number="true"
            spellcheck="false"
            tag="div"
            class="text-md mt-2 w-fit min-w-[75px] input-default font-semibold"
            placeholder="Year"
            :placeholder-classes="'text-gray-400 hover:text-gray-600'"
          />
        </div>

        <div class="flex flex-col gap-2 mt-2">
          <div class="flex gap-3">
            <div class="flex items-center">
              <div class="text-gray-800 text-xs font-light border-r pr-1 mr-1 border-gray-800">
                ISBN
              </div>
              <ContentEditable
                v-model="file.ISBN"
                spellcheck="false"
                tag="div"
                class="text-xs w-fit min-w-[100px] input-default"
                placeholder="ISBN"
                :placeholder-classes="'text-gray-400 hover:text-gray-600'"
              />
            </div>
            <div class="flex items-center">
              <div class="text-gray-800 text-xs font-light border-r pr-1 mr-1 border-gray-800">
                ISBN13
              </div>
              <ContentEditable
                v-model="file.ISBN13"
                spellcheck="false"
                tag="div"
                class="text-xs w-fit min-w-[100px] input-default"
                placeholder="ISBN13"
                :placeholder-classes="'text-gray-400 hover:text-gray-600'"
              />
            </div>
          </div>

          <div class="flex items-center">
            <div class="text-gray-800 text-xs font-light border-r pr-1 mr-1 border-gray-800">
              Filename
            </div>
            <div class="flex items-center">
              <ContentEditable
                v-model="file.name"
                spellcheck="false"
                tag="div"
                class="text-xs w-fit min-w-[100px] input-default"
                placeholder="Filename"
                :placeholder-classes="'text-gray-400 hover:text-gray-600'"
              />
              <button
                v-if="!autoSave"
                class="basic-button h-full py-0 text-xs ml-3"
                @click="manualSave"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="border-gray-600 px-3 py-1 border-l">
        <div>
          <div class="text-gray-800 font-medium">Read dates</div>
          <hr class="hr-default bg-gray-800 mb-2" />
          <ReadDetails v-model="file.read" />
        </div>
        <div class="mt-2">
          <div class="text-gray-800 font-medium">Rating</div>
          <hr class="hr-default bg-gray-800 mb-2" />
          <Rating v-model="file.myRating" />
        </div>
        <div class="mt-2">
          <div class="text-gray-800 font-medium">Tags</div>
          <hr class="hr-default bg-gray-800 mb-2" />
          <Tags v-model="file.tags" />
        </div>
      </div>
    </div>
    <hr class="hr-default my-4" />

    <div class="h-full">
      <Milkdown v-model="file.content" />
    </div>
  </div>
  <div ref="forDrag" class="absolute top-[-500px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watchEffect, onUnmounted, watch, nextTick } from 'vue';
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

    nextTick(() => {
      autoSave.value = true;
      loading.value = false;
    });
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
    if (!oldFile || !newFile || !autoSave.value || 'unsaved' in newFile || loading.value) return;

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
  loading.value = true;

  file.value = newFile;

  nextTick(() => {
    loading.value = false;
  });
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

<style scoped>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}
</style>
