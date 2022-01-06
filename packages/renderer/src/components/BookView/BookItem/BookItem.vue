<template>
  <Cover
    v-if="style === 'CARDS'"
    :title="currentFile.title"
    :author="currentFile.author"
    :year="currentFile.year"
    :rating="currentFile.myRating"
    class="cursor-pointer"
    @click.exact="openFullEditor(false)"
    @click.alt="openFullEditor(true)"
  />
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

import Cover from './Cover.vue';
import { useStore } from '/@/use/store';

export type IBookStyle = 'CARDS';

const internalInstance = getCurrentInstance();
const store = useStore();

const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
  style: {
    type: String as PropType<IBookStyle>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'open', newTab: boolean): void;
}>();

const editorOpened = ref(false);
const openFullEditor = (newTab: boolean) => {
  internalInstance?.emit('open', newTab);
};
</script>

<style scoped>
.editorWrapper {
  width: 66vw;
  height: 66vh;
}
</style>
