<template>
  <ContextMenu>
    <ContextMenuTrigger>
      <div
        :id="currentFile.path"
        ref="itemRef"
        v-test-class="'T-book-item'"
        class="cursor-pointer"
        @click.exact="openFullEditor({ place: 'current', focus: true })"
        @click.alt="openFullEditor({ place: 'last' })"
        @click.middle.exact="openFullEditor({ place: 'last' })"
      >
        <template v-if="viewStyle === 'Covers'">
          <Cover v-if="inViewport || !observer" :file="currentFile" class="transition-transform" />
          <div
            v-else
            class="aspect-[6/8] min-w-[150px] rounded bg-neutral-300 dark:bg-neutral-600"
          ></div>
        </template>
        <template v-if="viewStyle === 'Lines'">
          <div
            class="grid cursor-pointer grid-cols-5 gap-5 rounded-sm py-1 pl-1 transition-colors hover:bg-neutral-100 hover:dark:bg-neutral-800"
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
          <hr class="my-1 h-[1px] w-full border-0 bg-neutral-200 dark:bg-neutral-700" />
        </template>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @click="openFullEditor({ place: 'last', focus: true })">
        Open in a new tab
      </ContextMenuItem>

      <ContextMenuItem @click="deleteBook"> Delete </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { debounce as _debounce } from 'lodash';
import { dateReducerAllYears } from './getDateReducer';

import Cover from '../Cover/BookCover.vue';
import Rating from '../Rating/RatingStars.vue';

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '/@/components/_UI/ContextMenu/';

import type { PropType } from 'vue';
import type { IFile } from '/@main/services/files';
import type ElObserver from './elementObserver';
import type { IViewStyle } from '/@main/services/openedTabs';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '/@/use/store';
import { trpcApi } from '/@/utils/trpc';
export type IBookStyle = 'CARDS' | 'LINES';

const store = useStore();

const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
  viewStyle: {
    type: String as PropType<IViewStyle>,
    default: 'Covers',
  },
  observer: {
    type: Object as PropType<ElObserver>,
    default: undefined,
  },
});

const openFullEditor = (params: OpenNewOneParams) => {
  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'file',
      thing: props.currentFile.path,
      scrollPosition: 0,
    },
    params,
  );
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

  if (!store.settings) return '';

  return props.currentFile.read
    .reduce(dateReducerAllYears(store.settings.dateFormat), [])
    .join(', ');
});

const deleteBook = () => trpcApi.delete.mutate(props.currentFile.path);
</script>

<style scoped>
.editorWrapper {
  width: 66vw;
  height: 66vh;
}
</style>
