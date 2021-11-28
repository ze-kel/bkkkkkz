<template>
  <div class="editor">
    <ContentEditable v-model="fileProxy.title" tag="div" class="title" />
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import ContentEditable from 'vue-contenteditable';

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

<style lang="scss" scoped></style>
