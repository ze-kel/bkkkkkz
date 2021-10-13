<template>
  <div
    v-if="content.type === 'file'"
    :style="{ marginLeft: depth + 'px' }"
    :class="openedFile?.path === content.path && 'opened'"
    @click="content.type === 'file' ? selectFile(content) : ''"
  >
    [File] {{ content.name }}
  </div>
  <div v-else :style="{ marginLeft: depth + 'px' }">
    [Folder] {{ content.name }}
    <FileTree
      v-for="item in content.content"
      :key="item.path"
      :content="item"
      :depth="depth + 10"
      :opened-file="openedFile"
      @fileSelected="selectFile"
    />
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue';
import type { PropType } from 'vue';
import type { IFolder, IFile } from '/@main/services/files';

const internalInstance = getCurrentInstance();

const props = defineProps({
  content: {
    type: Object as PropType<IFolder | IFile>,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  openedFile: {
    type: Object as PropType<IFile | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'fileSelected', file: IFile): void;
}>();

const selectFile = (file: IFile) => {
  internalInstance?.emit('fileSelected', file);
};
</script>

<style scoped>
.opened {
  color: red;
}
</style>
