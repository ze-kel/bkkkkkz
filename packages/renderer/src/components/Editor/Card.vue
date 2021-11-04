<template>
  <div class="root">
    <div>{{ currentFile.name }}</div>
    <input v-model="titleProxy" placeholder="Title" type="text" />
    <input v-model="authorProxy" placeholder="Author" type="text" />
    <input v-model="yearProxy" placeholder="year" type="number" />
    <input v-model="ratingProxy" placeholder="Rating" type="number" />
    <textarea v-model="contentProxy" class="textarea"></textarea>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { ILoadedFile } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

const internalInstance = getCurrentInstance();

const props = defineProps({
  currentFile: {
    type: Object as PropType<ILoadedFile>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'update', path: string, key: keyof ILoadedFile, data: string): void;
}>();

const contentProxy = computed({
  get: () => props.currentFile.content,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', props.currentFile.path, 'content', val);
  },
});

const authorProxy = computed({
  get: () => props.currentFile.author,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', props.currentFile.path, 'author', val);
  },
});

const titleProxy = computed({
  get: () => props.currentFile.title,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', props.currentFile.path, 'title', val);
  },
});

const yearProxy = computed({
  get: () => props.currentFile.year,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', props.currentFile.path, 'year', val);
  },
});

const ratingProxy = computed({
  get: () => props.currentFile.myRating,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', props.currentFile.path, 'myRating', val);
  },
});
</script>

<style scoped>
.root {
  border: 2px solid greenyellow;
  border-radius: 4px;
}
</style>
