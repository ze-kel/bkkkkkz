<template>
  <div :id="currentFile.path" ref="itemRef">
    <template v-if="settings.viewStyle === 'Covers'">
      <Cover
        v-if="inViewport"
        :file="currentFile"
        class="cursor-pointer transition-transform"
        @click.exact="openFullEditor(false)"
        @click.middle.exact="openFullEditor(true, false)"
        @click.alt="openFullEditor(true)"
      />
      <div
        v-else
        class="aspect-[6/8] min-w-[150px] bg-neutral-300 dark:bg-neutral-600 rounded"
      ></div>
    </template>
    <template v-if="settings.viewStyle === 'Lines'">
      <div
        class="grid grid-cols-5 gap-5 cursor-pointer pl-1 transition-colors rounded-sm hover:bg-neutral-100 hover:dark:bg-neutral-800 py-1"
        @click.exact="openFullEditor(false)"
        @click.middle.exact="openFullEditor(true, false)"
        @click.alt="openFullEditor(true)"
      >
        <div class="truncate">
          {{ onlyMainTitle }}
        </div>
        <div class="truncate">
          {{ currentFile.author }}
        </div>
        <div class="truncate">
          {{ currentFile.year }}
        </div>
        <div class="truncate">
          {{ stringifiedDates }}
        </div>
        <div>
          <Rating :model-value="currentFile.myRating" disabled />
        </div>
      </div>
      <hr class="my-1 hr-default" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import _debounce from 'lodash-es/debounce';
import { dateReducerAllYears } from './getDateReducer';

import Cover from '../Cover/Cover.vue';
import { useStore } from '/@/use/store';
import Rating from '../Rating/Rating.vue';

import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import type { IOpenedFile, IViewSettings } from '/@main/services/watcher';
import type ElObserver from './elementObserver';

export type IBookStyle = 'CARDS' | 'LINES';

const store = useStore();

const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
  settings: {
    type: Object as PropType<IViewSettings>,
    required: true,
  },
  observer: {
    type: Object as PropType<ElObserver>,
    default: undefined,
  },
});

const openFullEditor = (newTab: boolean, openImmediatelly = true) => {
  const newOpened: IOpenedFile = { type: 'file', thing: props.currentFile.path };
  if (newTab) {
    store.addOpened('file', props.currentFile.path, openImmediatelly);
  } else {
    console.log('updopened', store.activeOpenedIndex);
    if (store.activeOpenedIndex < 0) return;
    store.updateOpened(store.activeOpenedIndex, 'file', props.currentFile.path);
  }
};

const itemRef = ref<HTMLElement>();

const inViewport = ref(false);

const triggerInView = (visible: boolean) => {
  inViewport.value = visible;
};

onMounted(() => {
  if (!itemRef.value || !props.observer) return;
  props.observer.watchElement(itemRef.value, triggerInView);
});

const onlyMainTitle = computed(() => props.currentFile.title?.split(':')[0]);

const stringifiedDates = computed(() => {
  if (!props.currentFile.read) return '';

  return props.currentFile.read.reduce(dateReducerAllYears, []).join(', ');
});
</script>

<style scoped>
.editorWrapper {
  width: 66vw;
  height: 66vh;
}
</style>
