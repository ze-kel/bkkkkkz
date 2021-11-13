<template>
  <div class="bookCard">
    <input v-model="titleProxy" placeholder="Title" class="title header-L bold" type="text" />
    <input v-model="authorProxy" placeholder="Author" class="author header-S" type="text" />
    <div class="smallInputs">
      <SmallInput :value="ratingProxy" text="Rating:" />
      <SmallInput :value="yearProxy" text="Year:" />
    </div>
    <input v-model.lazy="fileNameProxy" class="fileName header-XS" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { ILoadedFile } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

import SmallInput from './SmallInput/SmallInput.vue';

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

const fileNameProxy = computed({
  get: () => props.currentFile.name,
  set: (val) => {
    if (internalInstance) internalInstance.emit('rename', props.currentFile.path, val);
  },
});
</script>

<style scoped>
.bookCard {
  width: 100%;
  border-bottom: 2px solid var(--accent-main);
  align-items: center;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-bottom: 5px;
}

.title,
.author,
.fileName {
  text-align: center;
}

.author {
  color: var(--text-secondary);
}

.fileName {
  color: var(--text-tertiary);
}

.smallInputs {
  margin-top: 10px;
  display: flex;
}
</style>
