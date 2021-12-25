<template>
  <Popup :opened="editorOpened" @close="triggerFullEditor">
    <div class="editorWrapper">
      <Editor :file="currentFile" @update="passUpdate" />
    </div>
  </Popup>
  <Cover
    v-if="style === 'CARDS'"
    :title="currentFile.title"
    :author="currentFile.author"
    :year="currentFile.year"
    :rating="currentFile.myRating"
    class="cursor-pointer"
    @click="triggerFullEditor"
  />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

import Cover from './Cover.vue';
import Popup from '../../_UI/Popup.vue';
import Editor from '../../Editor/Editor.vue';

export type IBookStyle = 'CARDS';

const internalInstance = getCurrentInstance();

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
  (e: 'update', file: IFile): void;
}>();

const passUpdate = (val: IFile) => internalInstance?.emit('update', val);

const editorOpened = ref(false);
const triggerFullEditor = () => (editorOpened.value = !editorOpened.value);
</script>

<style scoped>
.editorWrapper {
  width: 66vw;
  height: 66vh;
}
</style>
