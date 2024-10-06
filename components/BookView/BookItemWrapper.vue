<!--This component provides interactivity for BookItem-->
<template>
  <div :id="currentFile.path" ref="itemRef">
    <template v-if="true">
      <ShContextMenu>
        <ShContextMenuTrigger>
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
        </ShContextMenuTrigger>

        <ShContextMenuContent>
          <ShContextMenuItem @click="openFullEditor({ place: 'last', focus: true })">
            Open in a new tab
          </ShContextMenuItem>

          <ShContextMenuItem @click="deleteBook"> Delete </ShContextMenuItem>
        </ShContextMenuContent>
      </ShContextMenu>

      <div v-if="isDragging" ref="forDrag" class="absolute top-[-50px]">
        <DragDisplay> {{ 'TODO: currentFile.name' }} </DragDisplay>
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
import { debounce as _debounce } from 'lodash';

import DragDisplay from '~/components/_ui/DragDisplay.vue';

import type { PropType } from 'vue';
import type { IViewStyle } from '~/api/openedTabs';
import { useStore } from '~~/utils/store';

import BookItemCover from '~/components/BookView/BookItemCover.vue';
import BookItemLine from '~/components/BookView/BookItemLine.vue';
import { testClasses } from '~/tools/tests/binds';
import type { IBookFromDb } from '~/api/watcher/metaCache';
import { remove } from '@tauri-apps/plugin-fs';
export type IBookStyle = 'CARDS' | 'LINES';

const store = useStore();

const props = defineProps({
  currentFile: {
    type: Object as PropType<IBookFromDb>,
    required: true,
  },
  viewStyle: {
    type: String as PropType<IViewStyle>,
    default: 'Covers',
  },
});

const openFullEditor = (params: OpenNewOneParams) => {
  console.log(props.currentFile);

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

const deleteBook = () => remove(props.currentFile.path);

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

<style scoped></style>
