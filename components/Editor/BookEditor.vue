<template>
  <div v-if="!loading" class="flex h-full w-full flex-col overflow-x-hidden overflow-y-scroll">
    <div class="mx-auto w-full max-w-2xl">
      <div class="grid gap-4 py-4" style="grid-template-columns: auto 1fr">
        <div class="flex flex-col items-center gap-2">
          <ContextMenu>
            <ContextMenuTrigger class="w-fit">
              <div
                class="aspect-[6/9] w-[175px] bg-transparent"
                :draggable="true"
                @dragstart="startDrag($event)"
              >
                <Cover :file="openedFile" />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem @click="setCoverHandle">
                {{ openedFile.cover ? 'Change cover' : 'Add cover' }}
              </ContextMenuItem>

              <ContextMenuItem @click="fetchCoverHandle"> Try to fetch cover </ContextMenuItem>

              <ContextMenuItem v-if="openedFile.cover" @click="removeCoverHandler">
                Remove cover
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          <Rating v-model="openedFile.myRating" class="mt-3 place-content-center self-center" />

          <BasicInput
            v-model="openedFile.isbn13"
            v-test-class="testClasses.editorIsbn"
            type="number"
            class="min-w-[100px] text-center opacity-50 focus:opacity-100"
            theme="hidden"
            placeholder="isbn13"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex w-full items-center gap-3">
            <BasicInput
              v-model="openedFile.name"
              v-test-class="testClasses.editorFilename"
              spellcheck="false"
              class="w-full min-w-[100px] opacity-50 focus:opacity-100"
              placeholder="Filename"
              theme="hidden"
            />

            <BasicButton v-if="!autoSave" variant="outline" size="sm" @click="manualSave">
              Save
            </BasicButton>
          </div>

          <BasicInput
            v-model="openedFile.title"
            v-test-class="testClasses.editorTitle"
            spellcheck="false"
            class="line-clamp-1 min-w-[100px] text-4xl font-light leading-none"
            placeholder="Title"
            theme="hidden"
          />
          <BasicInput
            v-model="openedFile.author"
            v-test-class="testClasses.editorAuthor"
            spellcheck="false"
            class="font-regular -mt-1 w-fit min-w-[100px] text-2xl leading-none"
            theme="hidden"
            placeholder="Author"
          />

          <div class="flex items-center gap-3">
            <BasicInput
              v-model="openedFile.year"
              v-test-class="testClasses.editorYear"
              type="number"
              theme="hidden"
              class="w-[75px]"
              placeholder="Year"
            />
          </div>

          <Tags v-model="openedFile.tags" class="" />
          <ReadDetails v-model="openedFile.read" class="mt-3" />
        </div>
      </div>

      <div class="h-full min-h-[200px] border-t border-neutral-300 py-4 dark:border-neutral-800">
        <MilkdownProvider>
          <MilkdownEditor v-model="openedFile.content" />
        </MilkdownProvider>
      </div>
    </div>
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watchEffect, onUnmounted, watch, nextTick, computed } from 'vue';
import ReadDetails from '../ReadDetails/ReadDetails.vue';
import Rating from '../Rating/RatingStars.vue';
import Tags from '../Tags/TagsEditor.vue';
import DragDisplay from '~/components/_UI/DragDisplay.vue';
import Cover from '../Cover/BookCover.vue';
import BasicInput from '../_UI/BasicInput.vue';
import MilkdownEditor from './MilkdownEditor.vue';

import { MilkdownProvider } from '@milkdown/vue';

import { cloneDeep as _cloneDeep } from 'lodash';
import { debounce as _debounce } from 'lodash';

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '~/components/_UI/ContextMenu/';

import type { PropType } from 'vue';
import {
  fetchCover,
  getFileContent,
  removeCover,
  renameEntity,
  saveFileContent,
  saveNewFile,
  setCover,
  type IFile,
  type ISavedFile,
  type IUnsavedFile,
} from '~/api/files';
import type { IOpenedFile, IOpenedNewFile } from '~/api/openedTabs';
import { useStore } from '~~/utils/store';
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';
import { testClasses } from '~/tools/tests/binds';
import { apiEventsEmitter } from '~/api/events';

const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile | IOpenedNewFile>,
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
    const res = await getFileContent(props.opened.thing);
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
    const saved = await saveNewFile({
      basePath: props.opened.thing,
      file: _cloneDeep(openedFile.value) as IUnsavedFile,
    });
    openedFile.value = saved;
    store.openNewOne({ ...props.opened, type: 'file', thing: saved.path }, { place: 'current' });
    autoSave.value = true;
  } else {
    save(openedFile.value);
  }
};

const save = (file: ISavedFile) => {
  saveFileContent(_cloneDeep(file));
};

const rename = async (newName: string) => {
  if (!openedFile.value || 'unsaved' in openedFile.value) return;
  const newPath = await renameEntity({ srcPath: openedFile.value.path, newName });
  store.openNewOne({ ...props.opened, thing: newPath }, { place: 'current' });
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
  console.log('update handler api', file);
  // TODO: Why are we ignoring indexes here?
  loading.value = true;

  openedFile.value = file;

  nextTick(() => {
    loading.value = false;
  });
};

const removeHandlerApi = () => {
  store.closeOpened();
};

onMounted(() => {
  apiEventsEmitter.addListener('FILE_UPDATE', updateHandlerApi);
  apiEventsEmitter.addListener('FILE_REMOVE', removeHandlerApi);
});

onUnmounted(() => {
  apiEventsEmitter.removeListener('FILE_UPDATE', updateHandlerApi);
  apiEventsEmitter.removeListener('FILE_REMOVE', removeHandlerApi);
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

  if (!store.openedTabs) return;
  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if ('unsaved' in openedFile.value) return [];
    if (opened.type === 'file' && opened.thing === openedFile.value?.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};

///
/// Cover Right click
///
const removeCoverHandler = () => {
  if ('unsaved' in openedFile.value) return;
  removeCover({ bookFilePath: openedFile.value.path });
};

const setCoverHandle = () => {
  if ('unsaved' in openedFile.value) return;
  setCover({ bookFilePath: openedFile.value.path });
};

const fetchCoverHandle = async () => {
  if (!openedFile.value.isbn13) {
    store.showNotification({
      title: `Can't fetch cover without isbn13`,
      text: 'Please specify ISBN and try again',
    });
    return;
  }

  if ('unsaved' in openedFile.value) {
    store.showNotification({
      title: `Can't fetch cover for unsaved file`,
      text: 'Save file and try again',
    });
    return;
  }

  fetchCover({ bookFilePath: openedFile.value.path });
};
</script>

<style scoped>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}
</style>
