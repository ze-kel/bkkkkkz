<template>
  <div class="">
    <ContentEditable
      v-model="fileProxy.title"
      spellcheck="false"
      tag="div"
      class="focus:outline-none w-fit text-xl border-b border-transparent focus:border-indigo-600"
    />
    <ContentEditable
      v-model="fileProxy.author"
      spellcheck="false"
      tag="div"
      class="focus:outline-none w-fit text-md border-b border-transparent focus:border-indigo-600"
    />
    <ReadDetails v-model="fileProxy.read" />
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import ContentEditable from 'vue-contenteditable';
import ReadDetails from '../ReadDetails/ReadDetails.vue';

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

const fileProxy = computed({
  get: () => props.file,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', val);
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
