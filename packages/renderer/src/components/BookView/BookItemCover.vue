<template>
  <div class="aspect-[6/9] bg-transparent">
    <BookCover v-if="isVisible" :file="currentFile"></BookCover>
  </div>
</template>

<script lang="ts" setup>
import BookCover from '/@/components/Cover/BookCover.vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
});
</script>
