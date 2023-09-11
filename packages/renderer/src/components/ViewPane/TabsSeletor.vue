<template>
  <div class="bg-neutral-50 dark:bg-neutral-900 h-10 relative">
    <template v-if="isDragging">
      <div
        v-for="(item, index) in store.opened.tabs"
        :key="index"
        class="absolute select-none left-0 top-0 px-2 py-1 w-[150px] h-10"
        :style="{
          transform: `translateX(${getXPosition(index)}px)`,
          zIndex: isDragging && index === draggingTab ? -1 : 4,
        }"
        @mouseover="mouseOverHandler(index)"
      ></div>
    </template>
    <div
      v-for="(item, index) in store.opened.tabs"
      :key="item.thing + index"
      v-test-class="['T-view-tab', index === store.opened.active && 'T-view-tab-opened']"
      class="absolute select-none left-0 top-0 px-2 py-1 w-[150px] h-10 flex items-center justify-between transition-colors border-transparent"
      :class="[
        index === store.opened.active
          ? 'dark:bg-neutral-950 rounded-tl-md rounded-tr-md'
          : 'text-neutral-300 dark:bg-neutral-900 dark:text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-900 cursor-pointer',
        isDragging && draggingTab === index ? '' : 'transition-all duration-300 ease-in-out',
      ]"
      :style="{
        transform: `translateX(${getXPosition(index)}px)`,
        zIndex: (isDragging && draggingTab === index) || index === store.opened.active ? 3 : 2,
      }"
      @mousedown="mouseDownHandler(index)"
    >
      <div v-if="store.rootPath" v-test-class="'T-label'" class="truncate">
        {{ formatHeader(item, store.rootPath) }}
      </div>

      <div
        class="hover:bg-neutral-800 rounded flex items-center h-4 ml-1 transition-colors cursor-pointer"
        @click="store.closeOpened(index)"
      >
        <CrossIcon
          class="w-4"
          :class="[
            index === store.opened.active
              ? 'stroke-neutral-50'
              : 'stroke-neutral-300 dark:stroke-neutral-600',
            'hover:stroke-white',
            'transition-colors',
          ]"
        />
      </div>
    </div>

    <div
      :class="
        classMerge(
          'w-full dragApp bg-neutral-900',
          canDropHere && 'bg-neutral-200 dark:bg-neutral-800',
        )
      "
      @drop="onDrop($event)"
      @dragenter="dragEnter"
      @dragleave="dragLeave"
      @dragover.prevent
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onRenderTriggered, onUpdated, ref, watch } from 'vue';
import formatHeader from '/@/utils/formatHeader';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';
import { useStore } from '/@/use/store';
import CrossIcon from '@heroicons/vue/24/outline/XMarkIcon';
import classMerge from '/@/utils/classMerge';

import { useMagicKeys, useMouse } from '@vueuse/core';
import type { IOpened } from '/@main/services/openedTabs';

const store = useStore();

//
// Drag & Drop from file\tag trees
//
const canDropHere = ref(false);

const dragEnter = (e: DragEvent) => {
  e.preventDefault();
  canDropHere.value = true;
};

const dragLeave = (e: DragEvent) => {
  e.preventDefault();
  canDropHere.value = false;
};

const onDrop = (e: DragEvent) => {
  canDropHere.value = false;

  const type = e.dataTransfer?.getData('type');
  const draggedPath = e.dataTransfer?.getData('itemPath');

  if (type !== 'file' && type !== 'folder') return;
  if (!draggedPath) return;

  store.openNewOne({
    type,
    thing: draggedPath,
    scrollPosition: 0,
    settings: getDefaultViewSettings(),
  });
};

//
// Dragging tabs around
//
const isDragging = ref(false);
const isAnimating = ref(false);
const draggingTab = ref<number>(0);

const baseX = ref(0);

const { x } = useMouse({ touch: false });

const xOffset = computed(() => (isDragging.value ? x.value - baseX.value : 0));

const mouseDownHandler = (index: number) => {
  store.setOpenedIndex(index);
  draggingTab.value = index;
  isAnimating.value = true;
  isDragging.value = true;
  baseX.value = x.value;

  window.addEventListener('mouseup', mouseUpHandler);
};
const mouseUpHandler = () => {
  window.removeEventListener('mouseup', mouseUpHandler);

  if (isDragging.value && typeof newPosition.value === 'number') {
    const newTabs = virtualizedOrder.value.map((ind) => store.opened.tabs[ind]);

    isDragging.value = false;

    setTimeout(() => {
      isAnimating.value = false;

      store.updateOpened({ tabs: newTabs, active: Number(newPosition.value) });
      newPosition.value = false;
    }, 300);
  } else {
    isDragging.value = false;
    newPosition.value = false;

    isAnimating.value = false;
    setTimeout(() => {}, 300);
  }
};

const newPosition = ref<boolean | number>(false);

const virtualizedOrder = computed(() => {
  const order = Array.from(Array(store.opened.tabs.length).keys());

  if (typeof newPosition.value === 'number' && typeof draggingTab.value === 'number') {
    order.splice(newPosition.value, 0, order.splice(draggingTab.value, 1)[0]);
  }

  return order;
});

const mouseOverHandler = (index: number) => {
  if (typeof draggingTab.value === 'number') {
    newPosition.value = virtualizedOrder.value.findIndex((v) => v === index);
  }
};

const getXPosition = (index: number) => {
  const v = virtualizedOrder.value.findIndex((v) => v === index) * 150;

  if (index === draggingTab.value && isDragging.value) {
    return draggingTab.value * 150 + xOffset.value;
  }
  return v;
};
</script>
