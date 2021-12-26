<template>
  <div class="">
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
      </div>

      <div>
        <ReadDetails v-model="readProxy" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import ContentEditable from 'vue-contenteditable';
import ReadDetails from '../ReadDetails/ReadDetails.vue';
import type { IDateRead } from '/@main/services/books';

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

const readProxy = computed({
  get: () => props.file.read,
  set: (val) => {
    const newFile = { ...props.file };
    newFile.read = val;
    internalInstance?.emit('update', newFile);
  },
});

onBeforeUnmount(() => {
  // If you have contenteditable focused when closing editor it will cause error in console.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});
</script>

<style scoped></style>
