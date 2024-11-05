<template>
  <div class="grid gap-4 py-4">
    <UiBasicInput
      v-if="openedFile.attrs.title"
      v-model="openedFile.attrs.title.Text"
      @update:model-value="emit('change')"
      spellcheck="false"
      class="line-clamp-1 min-w-[100px] text-4xl font-light leading-none"
      placeholder="Title"
      theme="hidden"
    />
    <UiBasicInput
      UiBasicInput
      v-if="openedFile.attrs.author"
      v-model="openedFile.attrs.author.Text"
      @update:model-value="emit('change')"
      spellcheck="false"
      class="font-regular -mt-1 w-fit min-w-[100px] text-2xl leading-none"
      theme="hidden"
      placeholder="Author"
    />

    <UiBasicInput
      v-if="openedFile.attrs.year"
      v-model="openedFile.attrs.year.Number"
      @update:model-value="emit('change')"
      type="number"
      theme="hidden"
      class="w-[75px]"
      placeholder="Year"
    />

    <EditorTagsEditor
      v-if="openedFile.attrs.tags"
      v-model="openedFile.attrs.tags.TextCollection"
      class=""
      @change="emit('change')"
    />
    <ReadDetails
      v-if="openedFile.attrs.read"
      v-model="openedFile.attrs.read.DatesPairCollection"
      class="mt-3"
      @update:model-value="emit('change')"
    />
    <RatingStars
      v-if="openedFile.attrs.myRating"
      v-model="openedFile.attrs.myRating.Number"
      @update:model-value="emit('change')"
      class="mt-3 place-content-center self-center"
    />

    <UiBasicInput
      v-if="openedFile.attrs.ISBN13"
      v-model="openedFile.attrs.ISBN13.Text"
      @update:model-value="emit('change')"
      type="number"
      class="min-w-[100px] text-center opacity-50 focus:opacity-100"
      theme="hidden"
      placeholder="isbn13"
    />
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <UiDragDisplay> dragging </UiDragDisplay>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner';
import { fetchCover, removeCover, setCover } from '~/api/files';
import type { IBookFromDb } from '~/api/tauriEvents';
import ReadDetails from './ReadDetails/ReadDetails.vue';

const openedFile = defineModel<IBookFromDb>({
  required: true,
});

const emit = defineEmits(['change']);

/*
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
  if (!openedFile.value.ISBN13) {
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

};  */
</script>
