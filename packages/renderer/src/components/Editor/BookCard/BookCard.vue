<template>
  <div class="bookCard">
    <div placeholder="Author" class="author header-L" type="text">{{ authorProxy }}</div>
    <hr class="hr" />
    <div placeholder="Title" class="title header-L bold" type="text">{{ mainTitle }}</div>
    <div class="smallInputs">
      <SmallInput :value="ratingProxy" text="Rating" />
      <SmallInput :value="yearProxy" text="Year" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

import SmallInput from './SmallInput/SmallInput.vue';

const internalInstance = getCurrentInstance();

const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'update', path: string, key: keyof IFile, data: string): void;
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

const mainTitle = computed(() => titleProxy.value?.split(':')[0]);

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
  align-items: center;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-bottom: 5px;
  padding: 17px;
  box-shadow: 0px 0px 50px -15px hsla(0, 0%, 2%, 0.05);
  box-shadow: 4px 4px 10px 0px hsla(0, 0%, 0%, 0.06);
  border-radius: 5px;
  width: 100%;
}

.title,
.author,
.subtitle,
.fileName {
  text-align: center;
  width: 100%;
}

.hr {
  width: 66%;
  height: 2px;
  background: var(--accent-main-grad);
  margin: 7px 0 4px 0;
}

.author {
  color: var(--text-secondary);
  font-weight: 300;
}

.subtitle {
  margin-top: 4px;
  color: var(--text-secondary);
}

.title {
  font-weight: 500;
  color: var(--text-main);
}

.fileName {
  color: var(--text-secondary);
}

.smallInputs {
  margin-top: 16px;
  display: flex;
}
</style>
