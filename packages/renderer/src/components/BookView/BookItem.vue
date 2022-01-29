<template>
  <div :id="currentFile.name" ref="itemRef">
    <template v-if="style === 'CARDS'">
      <Cover
        v-if="inViewport"
        :file="currentFile"
        class="cursor-pointer"
        @click.exact="openFullEditor(false)"
        @click.alt="openFullEditor(true)"
      />
      <div
        v-else
        class="aspect-[6/8] min-w-[150px] bg-neutral-300 border-gray-700 border-0 rounded"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import _debounce from 'lodash-es/debounce';

import Cover from '../Cover/Cover.vue';
import { watchElement } from './commonOserver';
import { useStore } from '/@/use/store';

import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';

export type IBookStyle = 'CARDS';

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
  emit('open', newTab);
};

const itemRef = ref<HTMLElement>();

const inViewport = ref(false);

const triggerInView = (visible: boolean) => {
  inViewport.value = visible;
};

onMounted(() => {
  if (!itemRef.value) return;
  watchElement(itemRef.value, triggerInView);
});
</script>

<style scoped>
.editorWrapper {
  width: 66vw;
  height: 66vh;
}
</style>
