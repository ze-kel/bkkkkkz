<template>
  <div class="aspect-[6/9] bg-transparent">
    <BookCover v-if="isVisible" :file="currentFile"></BookCover>
  </div>
</template>

<script lang="ts" setup>
import BookCover from '~/components/Cover/BookCover.vue';
import type { PropType } from 'vue';
import type { IFile } from '~/api/files';
import type { IBookFromDb } from '~/api/watcher/metaCache';
const props = defineProps({
  currentFile: {
    type: Object as PropType<IBookFromDb>,
    required: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
});
</script>
