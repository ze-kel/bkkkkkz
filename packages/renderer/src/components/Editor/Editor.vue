<template>
  <div class="flex flex-col h-full">
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
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import ContentEditable from 'vue-contenteditable';
import ReadDetails from '../ReadDetails/ReadDetails.vue';
import Rating from '../Rating/Rating.vue';
import type { IDateRead } from '/@main/services/books';
import Milkdown from './Mikdown.vue';
import Tags from '../Tags/Tags.vue';

const internalInstance = getCurrentInstance();

const props = defineProps({
  file: {
    type: Object as PropType<IFile>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'update', file: IFile): void;
}>();

const titleProxy = computed({
  get: () => props.file.title,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.title = val;
    internalInstance?.emit('update', newFile);
  },
});

const authorProxy = computed({
  get: () => props.file.author,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.author = val;
    internalInstance?.emit('update', newFile);
  },
});

const ratingProxy = computed({
  get: () => props.file.myRating || 0,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.myRating = val;
    internalInstance?.emit('update', newFile);
  },
});

const readProxy = computed({
  get: () => props.file.read,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.read = val;
    internalInstance?.emit('update', newFile);
  },
});

const tagsProxy = computed({
  get: () => props.file.tags,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.tags = val;
    internalInstance?.emit('update', newFile);
  },
});

const pathProxy = computed({
  get: () => props.file.path,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.path = val;
    internalInstance?.emit('update', newFile);
  },
});

const updateMarkdown = (content: string) => {
  internalInstance?.emit('update', { ...props.file, content });
};

onBeforeUnmount(() => {
  // If you have contenteditable focused when closing editor it will cause error in console.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});
</script>

<style scoped></style>
