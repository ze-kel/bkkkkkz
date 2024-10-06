<template>
  <div v-if="!loading" class="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
    <div class="mx-auto w-full max-w-2xl">
      <div class="grid gap-4 py-4" style="grid-template-columns: auto 1fr">
        <div class="flex flex-col items-center gap-2">
          <ShContextMenu>
            <ShContextMenuTrigger class="w-fit">
              <div
                class="aspect-[6/9] w-[175px] bg-transparent"
                :draggable="true"
                @dragstart="startDrag($event)"
              >
                <Cover :file="openedFile" />
              </div>
            </ShContextMenuTrigger>
            <ShContextMenuContent>
              <ShContextMenuItem @click="setCoverHandle">
                {{ openedFile.cover ? 'Change cover' : 'Add cover' }}
              </ShContextMenuItem>

              <ShContextMenuItem @click="fetchCoverHandle"> Try to fetch cover </ShContextMenuItem>

              <ShContextMenuItem v-if="openedFile.cover" @click="removeCoverHandler">
                Remove cover
              </ShContextMenuItem>
            </ShContextMenuContent>
          </ShContextMenu>

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

          <TagsEditor v-model="openedFile.tags" class="" />
          <ReadDetails v-model="openedFile.read" class="mt-3" />
        </div>
      </div>

      <div class="h-full min-h-[200px] border-t border-neutral-300 py-4 dark:border-neutral-800">
        <Editor2
          ref="markdown"
          :initial-value="openedFile.content"
          @change="
            () => {
              unsavedMarkdownChanges++;
              debouncedSave();
            }
          "
        />
      </div>
    </div>
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <DragDisplay> {{ dragging }} </DragDisplay>
  </div>
</template>

<script lang="ts" setup>
import ReadDetails from './ReadDetails/ReadDetails.vue';
import Rating from '../Rating/RatingStars.vue';
import TagsEditor from './TagsEditor/index.vue';
import DragDisplay from '~/components/_ui/DragDisplay.vue';
import Cover from '../Cover/BookCover.vue';
import BasicInput from '../_UI/BasicInput.vue';

import { cloneDeep as _cloneDeep } from 'lodash';
import { debounce as _debounce } from 'lodash';

import type { PropType } from 'vue';
import {
  fetchCover,
  getFileContent,
  removeCover,
  renameEntity,
  saveFileContent,
  setCover,
  type IFile,
  type ISavedFile,
} from '~/api/files';
import type { IOpenedFile } from '~/api/openedTabs';
import { useStore } from '~~/utils/store';
import { testClasses } from '~/tools/tests/binds';
import { useApiEventListener } from '~/api/events';
import { toast } from 'vue-sonner';
import type { EditorView } from '@codemirror/view';

const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile>,
    required: true,
  },
});

const openedFile = ref<ISavedFile>({ name: '', path: '' });
const previousName = ref('');
const loading = ref(true);

const markdownRef = useTemplateRef('markdown');

watchEffect(async () => {
  if (props.opened.type === 'file') {
    loading.value = true;
    const res = await getFileContent(props.opened.thing);
    previousName.value = res.name || '';
    openedFile.value = res;

    nextTick(() => {
      loading.value = false;
    });
  } else {
    loading.value = false;
  }
});

const unsavedMarkdownChanges = ref(0);

const save = async () => {
  const file = openedFile.value;
  if (!file.path || !file.name) return;
  let sc = 0;
  if (markdownRef.value && markdownRef.value.$.exposed) {
    const { editor } = markdownRef.value.$.exposed as { editor: Ref<EditorView | null> };

    if (editor.value) {
      file.content = editor.value?.state.doc.toString();
      sc = unsavedMarkdownChanges.value;
    }
  }

  await saveFileContent(file);
  unsavedMarkdownChanges.value = unsavedMarkdownChanges.value - sc;
};

const rename = async (newName: string) => {
  if (!openedFile.value.path) return;
  const newPath = await renameEntity({ srcPath: openedFile.value.path, newName });
  store.openNewOne({ ...props.opened, thing: newPath }, { place: 'current' });
};

const debouncedSave = _debounce(save, 500);
const debouncedRename = _debounce(rename, 500);

onBeforeUnmount(async () => {
  debouncedRename.cancel();
  if (unsavedMarkdownChanges.value > 0) {
    debouncedSave();
  }
  debouncedSave.flush();
});

watch(
  openedFile,
  (newFile, oldFile) => {
    if (!oldFile || !newFile || loading.value) return;

    // Can't check against oldFile because after mutation it will be the same
    // OldFile is still useful to eliminate initial load case
    if (newFile.name && newFile.name !== previousName.value) {
      debouncedRename(newFile.name);
    } else {
      debouncedSave();
    }
  },
  { deep: true },
);

//
// Update events handling
//
const updateHandlerApi = ({ file }: { file: IFile }) => {
  loading.value = true;

  openedFile.value = file;

  if (markdownRef.value && markdownRef.value.$.exposed) {
    const { editor } = markdownRef.value.$.exposed as { editor: Ref<EditorView | null> };

    if (editor.value) {
      // TODO: this is just replacing the doc. It should at least apply unsaved transactions. In the ideal case diff and change parts
      editor.value.dispatch({
        changes: {
          from: 0,
          to: editor.value.state.doc.length,
          insert: file.content,
        },
      });
    }
  }

  nextTick(() => {
    loading.value = false;
  });
};

useApiEventListener('FILE_UPDATE', updateHandlerApi);

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
const removeCoverHandler = async () => {
  if ('unsaved' in openedFile.value) return;
  removeCover({ bookFilePath: openedFile.value.path });
};

const setCoverHandle = () => {
  if ('unsaved' in openedFile.value) return;
  setCover({ bookFilePath: openedFile.value.path });
};

const fetchCoverHandle = async () => {
  if (!openedFile.value.isbn13) {
    toast.error("Can't fetch cover without isbn13", {
      description: 'Please specify ISBN and try again',
    });
    return;
  }

  if ('unsaved' in openedFile.value) {
    toast.error(`Can't fetch cover for unsaved file`, {
      description: 'Save file and try again',
    });
    return;
  }

  const promise = fetchCover({ bookFilePath: openedFile.value.path });

  toast.promise(promise, {
    loading: 'Fetching...',
    success: () => {
      return `Cover updated`;
    },
    error: (e: any) => {
      return String(e);
    },
  });
};
</script>

<style scoped>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}
</style>
