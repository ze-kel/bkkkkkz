<template>
  <div :id="currentFile.name" ref="itemRef">
    <template v-if="store.settings?.viewSettings.viewStyle === 'Covers'">
      <Cover
        v-if="inViewport"
        :file="currentFile"
        class="cursor-pointer"
        @click.exact="openFullEditor(false)"
        @click.middle.exact="openFullEditor(true, false)"
        @click.alt="openFullEditor(true)"
      />
      <div
        v-else
        class="aspect-[6/8] min-w-[150px] bg-neutral-300 dark:bg-neutral-600 rounded"
      ></div>
    </template>
    <template v-if="store.settings?.viewSettings.viewStyle === 'Lines'">
      <div
        class="grid grid-cols-5 gap-5 cursor-pointer pl-1 transition-colors rounded hover:bg-neutral-100 hover:dark:bg-neutral-800 py-1"
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

import Cover from '../Cover/Cover.vue';
import { watchElement } from './commonOserver';
import { useStore } from '/@/use/store';
import Rating from '../Rating/Rating.vue';

import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import type { IOpenedFile } from '/@main/services/watcher';
import { dateReducerAllYears } from './getDateReducer';

export type IBookStyle = 'CARDS' | 'LINES';

const store = useStore();

const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
});

const openFullEditor = (newTab: boolean, openImmediatelly = true) => {
  const newOpened: IOpenedFile = { type: 'file', thing: props.currentFile.path };
  if (newTab) {
    store.addOpened(newOpened, openImmediatelly);
  } else {
    console.log('updopened', store.activeOpenedIndex);
    if (store.activeOpenedIndex === null) return;
    store.updateOpened(store.activeOpenedIndex, newOpened);
  }
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
