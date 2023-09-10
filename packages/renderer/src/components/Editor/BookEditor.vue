<template>
  <div v-if="!loading" class="flex h-full w-full flex-col overflow-x-hidden overflow-y-scroll">
    <div class="mx-auto w-full max-w-xl">
      <div class="flex flex-col">
        <div class="flex justify-center py-2" :draggable="true" @dragstart="startDrag($event)">
          <Cover :file="openedFile" class="h-60" @click.right="coverRightClick" />
        </div>

        <div class="flex flex-col items-center gap-2">
          <ContentEditable
            v-model="openedFile.title"
            v-test-class="'T-editor-title'"
            spellcheck="false"
            tag="div"
            class="w-fit min-w-[100px] text-4xl"
            placeholder="Title"
            :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
          />
          <ContentEditable
            v-model="openedFile.author"
            v-test-class="'T-editor-author'"
            spellcheck="false"
            tag="div"
            class="font-regular w-fit min-w-[100px] text-2xl dark:text-neutral-100"
            placeholder="Author"
            :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
          />
        </div>

        <div class="flex w-full flex-col justify-between py-2">
          <div class="mt-3 grid grid-cols-4 items-center gap-2">
            <h4 class="text-xs">Year</h4>

            <h4 class="text-xs">Rating</h4>

            <h4 class="text-xs">ISBN</h4>

            <div class="text-xs">Saved as</div>

            <ContentEditable
              v-model="openedFile.year"
              v-test-class="'T-editor-year'"
              :number="true"
              spellcheck="false"
              tag="div"
              class="min-w-[75px]"
              placeholder="Year"
              :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
            />
            <div class="cursor-pointer font-bold">
              <Rating v-model="openedFile.myRating" />
            </div>

            <ContentEditable
              v-model="openedFile.ISBN13"
              v-test-class="'T-editor-isbn'"
              :number="true"
              spellcheck="false"
              tag="div"
              class="min-w-[100px]"
              placeholder="ISBN13"
              :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
            />

            <div class="flex items-center">
              <ContentEditable
                v-model="openedFile.name"
                v-test-class="'T-editor-filename'"
                spellcheck="false"
                tag="div"
                class="min-w-[100px]"
                placeholder="Filename"
                :placeholder-classes="'text-neutral-400 hover:text-neutral-600'"
              />
            </div>
          </div>

          <button v-if="!autoSave" class="ml-3 h-full py-0 text-xs" @click="manualSave">
            Save
          </button>

          <div class="mt-3 text-sm">Read dates</div>
          <ReadDetails v-model="openedFile.read" />

          <div class="mt-3 text-sm">Tags</div>
          <Tags v-model="openedFile.tags" class="my-1" />
        </div>
      </div>

      <div class="h-full min-h-[200px] border-t border-neutral-300 py-4 dark:border-neutral-800">
        <Milkdown v-model="openedFile.content" />
      </div>
    </div>
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watchEffect, onUnmounted, watch, nextTick, computed } from 'vue';
import { openMenu } from '/@/use/contextMenu';

import ContentEditable from '../_UI/ContentEditable.vue';
import ReadDetails from '../ReadDetails/ReadDetails.vue';
import Rating from '../Rating/RatingStars.vue';
import Milkdown from './MdMikdown.vue';
import Tags from '../Tags/TagsEditor.vue';
import DragDisplay from '/@/components/_UI/DragDisplay.vue';
import Cover from '../Cover/BookCover.vue';
import TextEditable from '../_UI/TextEditable.vue';

import { cloneDeep as _cloneDeep } from 'lodash';
import { debounce as _debounce } from 'lodash';
import { ISBN10to13 } from '/@main/helpers/utils';

import type { PropType } from 'vue';
import type { IFile, ISavedFile, IUnsavedFile } from '/@main/services/files';
import type { ContextMenu } from '/@/use/contextMenu';
import { trpcApi } from '/@/utils/trpc';
import type { Unsubscribable } from '@trpc/server/observable';
import type { IOpenedFile, IOpenedNewFile } from '/@main/services/openedTabs';
import { useStore } from '/@/use/store';

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

const openedFile = ref<ISavedFile | IUnsavedFile>({ unsaved: true, name: '' });
const previousName = ref('');
const autoSave = ref(false);
const loading = ref(true);

watchEffect(async () => {
  if (props.opened.type === 'file') {
    loading.value = true;
    const res = await trpcApi.loadFileContent.query(props.opened.thing);
    previousName.value = res.name || '';
    openedFile.value = res;

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
  if ('unsaved' in openedFile.value) {
    const saved = await trpcApi.saveNewFile.mutate({
      basePath: props.opened.thing,
      file: _cloneDeep(openedFile.value) as IUnsavedFile,
    });
    openedFile.value = saved;
    store.openNewOne({ ...props.opened, type: 'file', thing: saved.path }, { index: props.index });
    autoSave.value = true;
  } else {
    save(openedFile.value);
  }
};

const save = (file: ISavedFile) => {
  trpcApi.saveFileContent.mutate(_cloneDeep(file));
};

const rename = async (newName: string) => {
  if (!openedFile.value || 'unsaved' in openedFile.value) return;
  const newPath = await trpcApi.rename.mutate({ srcPath: openedFile.value.path, newName });
  store.openNewOne({ ...props.opened, thing: newPath }, { index: props.index });
};

const debouncedSave = _debounce(save, 500);
const debouncedRename = _debounce(rename, 500);

watch(
  openedFile,
  (newFile, oldFile) => {
    if (!oldFile || !newFile || !autoSave.value || 'unsaved' in newFile || loading.value) return;

    // Can't check against oldFile because after mutation it will be the same
    // OldFile is still useful to eliminate initial load case
    if (newFile.name && newFile.name !== previousName.value) {
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
const updateHandlerApi = ({ file }: { file: IFile }) => {
  // TODO: Why are we ignoring indexes here?
  loading.value = true;

  openedFile.value = file;

  nextTick(() => {
    loading.value = false;
  });
};
const toClear: Array<Unsubscribable> = [];

const registerHandles = () => {
  const u = trpcApi.fileUpdate.subscribe(undefined, {
    onData: updateHandlerApi,
  });
  const r = trpcApi.fileRemove.subscribe(undefined, {
    onData: () => {
      store.closeOpened(props.index);
    },
  });
  toClear.push(u, r);
};

onMounted(() => {
  registerHandles();
});

onUnmounted(() => {
  toClear.forEach((u) => u.unsubscribe());
});

//
// File drag & drop
//
const dragging = ref('');
const forDrag = ref();
const startDrag = (devt: DragEvent) => {
  if (
    devt.dataTransfer === null ||
    !openedFile.value ||
    'unsaved' in openedFile.value ||
    !openedFile.value.name
  ) {
    return;
  }

  devt.dataTransfer.setData('itemPath', openedFile.value.path);
  devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  dragging.value = openedFile.value.name;

  if (!store.opened.tabs) return;
  const toUpdateIndexes = store.opened.tabs.reduce((acc: number[], opened, index) => {
    if ('unsaved' in openedFile.value) return [];
    if (opened.type === 'file' && opened.thing === openedFile.value?.path) {
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
    return openedFile.value.title?.split(':')[0] || '';
  },
  set(val: string) {
    openedFile.value.title = secondaryTitle.value ? val + ':' + secondaryTitle.value : val;
  },
});

const secondaryTitle = computed({
  get() {
    const [main, ...rest] = openedFile.value.title?.split(':') || ['', ''];
    return rest.join(':');
  },
  set(val: string) {
    openedFile.value.title = val ? mainTitle.value + ':' + val : mainTitle.value;
  },
});

const mainTitleRef = ref<HTMLElement | undefined>(undefined);

const removeSecondary = () => {
  openedFile.value.title = mainTitle.value + secondaryTitle.value;
  nextTick(() => {
    mainTitleRef.value?.focus();
  });
};

///
/// Cover Right click
///
const removeCover = () => {
  if ('unsaved' in openedFile.value) return;
  trpcApi.removeCoverFile.mutate(openedFile.value.path);
};

const setCover = () => {
  if ('unsaved' in openedFile.value) return;
  trpcApi.setCover.mutate(openedFile.value.path);
};

const coverRightClick = (e: MouseEvent) => {
  const menu: ContextMenu = [];

  if ('unsaved' in openedFile.value) return;

  if (openedFile.value.cover) {
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
