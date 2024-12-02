<template>
  <div class="grid gap-2" :class="$attrs.class">
    <template v-for="item in schema?.items">
      <div>
        <UiBasicInput
          v-if="item.value.type === 'Text'"
          v-model:model-value="openedFile.attrs[item.name]"
          :placeholder="item.value.settings.displayName || item.name"
          :theme="item.value.settings.theme"
          :multi-line="item.value.settings.isMultiline"
          :size="item.value.settings.size"
          :font="item.value.settings.font"
          :weight="item.value.settings.weight"
        />

        <UiBasicInput
          v-if="item.value.type === 'Number'"
          :placeholder="item.value.settings.displayName || item.name"
          v-model:isNumber="openedFile.attrs[item.name]"
        />

        <EditorTagsEditor
          v-if="item.value.type === 'TextCollection'"
          v-model:model-value="openedFile.attrs[item.name]"
        />

        <ReadDetails
          v-if="item.value.type === 'DatesPairCollection'"
          v-model:model-value="openedFile.attrs[item.name]"
        />
      </div>
    </template>
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <UiDragDisplay> dragging </UiDragDisplay>
  </div>
</template>

<script setup lang="ts">
import ReadDetails from './ReadDetails/ReadDetails.vue';
import type { PropType } from 'vue';
import type { IBookFromDb, Schema } from '~/api/schema';

defineProps({
  schema: {
    type: Object as PropType<Schema | null>,
  },
});

const openedFile = defineModel<IBookFromDb>({
  required: true,
});

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
