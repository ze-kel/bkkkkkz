<!--This component provides interactivity for BookItem-->
<template>
  <div :id="currentFile.path" ref="itemRef">
    <template v-if="inViewport || !observer">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            v-test-class="testClasses.bookItems"
            v-bind="$attrs"
            class="cursor-pointer"
            :draggable="true"
            :class="$attrs.class"
            @click.exact="openFullEditor({ place: 'current', focus: true })"
            @click.alt="openFullEditor({ place: 'last' })"
            @click.middle.exact="openFullEditor({ place: 'last' })"
            @dragstart="startDrag"
            @dragend="() => (isDragging = false)"
          >
            <BookItemCover
              v-if="viewStyle === 'Covers'"
              :current-file="currentFile"
              :is-visible="true"
            />
            <BookItemLine v-else :current-file="currentFile" :is-visible="true" />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem @click="openFullEditor({ place: 'last', focus: true })">
            Open in a new tab
          </ContextMenuItem>

          <ContextMenuItem @click="deleteBook"> Delete </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <div v-if="isDragging" ref="forDrag" class="absolute top-[-50px]">
        <DragDisplay> {{ currentFile.name }} </DragDisplay>
      </div>
    </template>

    <template v-else>
      <BookItemCover
        v-if="viewStyle === 'Covers'"
        :current-file="currentFile"
        :is-visible="false"
      />
      <BookItemLine v-else :current-file="currentFile" :is-visible="false" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

import { debounce as _debounce } from 'lodash';

import DragDisplay from '../_UI/DragDisplay.vue';

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '~/components/_UI/ContextMenu/';

import type { PropType } from 'vue';
import type { IFile } from '~/server/services/files';
import type ElObserver from './elementObserver';
import type { IViewStyle } from '~/server/services/openedTabs';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '~~/utils/store';
const { $trpc } = useNuxtApp();

import BookItemCover from '~/components/BookView/BookItemCover.vue';
import BookItemLine from '~/components/BookView/BookItemLine.vue';
import { testClasses } from '~/plugins/testClass/binds';
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

const deleteBook = () => $trpc.delete.mutate(props.currentFile.path);

//
// Drag & drop
//

const forDrag = ref();
const isDragging = ref(false);
const startDrag = (devt: DragEvent) => {
  isDragging.value = true;

  if (devt.dataTransfer === null) {
    return;
  }

  devt.dataTransfer.setData('type', 'file');

  devt.dataTransfer.setData('itemPath', props.currentFile.path);

  if (!store.openedTabs) return;
  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if (opened.type === 'file' && opened.thing === props.currentFile.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  nextTick(() => {
    if (devt.dataTransfer === null) {
      return;
    }
    devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  });
  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};
</script>

<style scoped>
.editorWrapper {
  width: 66vw;
  height: 66vh;
}
</style>
