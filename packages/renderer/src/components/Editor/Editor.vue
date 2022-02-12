<template>
  <div v-if="!loading" class="flex flex-col h-full">
    <div class="grid customTopGrid gap-4 px-2">
      <div class="py-2" :draggable="true" @dragstart="startDrag($event)">
        <Cover :file="file" class="aspect-[6/8] max-h-60" @click.right="coverRightClick" />
      </div>
      <div class="flex-grow flex flex-col justify-between py-2">
        <div>
          <ContentEditable
            v-model="file.title"
            spellcheck="false"
            tag="div"
            class="text-2xl w-fit min-w-[100px] input-default"
            placeholder="Title"
            :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
          />
          <ContentEditable
            v-model="file.author"
            spellcheck="false"
            tag="div"
            class="text-xl w-fit min-w-[100px] input-default font-regular"
            placeholder="Author"
            :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
          />
          <ContentEditable
            v-model="file.year"
            :number="true"
            spellcheck="false"
            tag="div"
            class="text-md mt-1 w-fit min-w-[75px] input-default font-semibold"
            placeholder="Year"
            :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
          />
        </div>

        <div class="flex flex-col gap-2 mt-2">
          <div class="flex group">
            <ContentEditable
              v-model="file.ISBN13"
              :number="true"
              spellcheck="false"
              tag="div"
              class="text-xs w-fit min-w-[100px] input-default"
              placeholder="ISBN13"
              :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
            />
            <div
              v-if="showConvertISBNButton"
              class="text-xs pl-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              :class="showISBNConversionError && 'text-red-700'"
              @click="convertISBN"
            >
              {{
                showISBNConversionError
                  ? 'Please enter a valid 10 digit ISBN'
                  : 'Convert from ISBN10'
              }}
            </div>
          </div>

          <div class="flex items-center">
            <div class="flex items-center">
              <ContentEditable
                v-model="file.name"
                spellcheck="false"
                tag="div"
                class="text-xs w-fit min-w-[100px] input-default"
                placeholder="Filename"
                :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
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

      <div class="border-neutral-200 dark:border-neutral-700 h-full border-l">
        <div class="border-b border-neutral-200 dark:border-neutral-700 p-2">
          <div class="text-neutral-800 dark:text-neutral-100 font-medium">Read dates</div>
          <ReadDetails v-model="file.read" />
        </div>
        <div class="border-b border-neutral-200 dark:border-neutral-700 p-2">
          <div class="text-neutral-800 dark:text-neutral-100 font-medium">Rating</div>
          <Rating v-model="file.myRating" />
        </div>
        <div class="p-2">
          <div class="text-neutral-800 dark:text-neutral-100 font-medium">Tags</div>
          <Tags v-model="file.tags" class="my-1" />
        </div>
      </div>
    </div>

    <div class="h-full border-t border-neutral-300 dark:border-neutral-700 p-4">
      <Milkdown v-model="file.content" />
    </div>
  </div>
  <div ref="forDrag" class="absolute top-[-500px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watchEffect, onUnmounted, watch, nextTick, computed } from 'vue';
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
import { ISBN10to13 } from '/@main/helpers/utils';
import { stringify } from 'querystring';

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
    store.updateOpened(props.index, 'file', toBeSaved.path);
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
  store.updateOpened(props.index, 'file', newPath);
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

//
// Title Split
//
const mainTitle = computed({
  get() {
    return file.value.title?.split(':')[0] || '';
  },
  set(val: string) {
    file.value.title = secondaryTitle.value ? val + ':' + secondaryTitle.value : val;
  },
});

const secondaryTitle = computed({
  get() {
    const [main, ...rest] = file.value.title?.split(':') || ['', ''];
    return rest.join(':');
  },
  set(val: string) {
    file.value.title = val ? mainTitle.value + ':' + val : mainTitle.value;
  },
});

const mainTitleRef = ref<HTMLElement | undefined>(undefined);

const removeSecondary = () => {
  file.value.title = mainTitle.value + secondaryTitle.value;
  nextTick(() => {
    console.log('next tick ref', mainTitleRef.value);
    mainTitleRef.value?.focus();
  });
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

//
// Isbn Conversion
//
const showISBNConversionError = ref(false);
const showConvertISBNButton = computed(() => {
  return !file.value.ISBN13 || String(file.value.ISBN13).length < 13;
});

const convertISBN = () => {
  if (!file.value.ISBN13 || String(file.value.ISBN13).length != 10) {
    showISBNConversionError.value = true;
    setTimeout(() => {
      showISBNConversionError.value = false;
    }, 3000);
  } else {
    file.value.ISBN13 = ISBN10to13(file.value.ISBN13);
  }
};
</script>

<style scoped>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}
</style>
