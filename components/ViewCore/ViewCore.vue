<template>
  <div v-if="store.openedItem" :key="store.openedItem.id" class="h-full w-full">
    <template v-if="store.openedItem.type === 'innerPage'"> home page is deprecated </template>
    <template v-else>
      <BookEditor
        v-if="store.openedItem.type === 'file' || store.openedItem.type === 'newFile'"
        :opened="store.openedItem"
      />
      <BookView v-else :opened="store.openedItem" :index="store.openedTabsActiveIndex || 0" />
    </template>
  </div>

  <NoTabPlaceholder v-else />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { debounce as _debounce } from 'lodash';

import BookView from '~/components/BookView/BooksView.vue';
import TabsSelector from './TabsSelector.vue';
import NoTabPlaceholder from '~/components/Placeholders/NoTabPlaceholder.vue';

const store = useStore();

const fileTreeSize = ref<number>(200);

const resizeHandle = ref<HTMLDivElement | null>(null);

const isResizing = ref<boolean>(false);
const startResizeAt = ref<number>(0);
const changeFileTreeSize = (e: MouseEvent) => {
  e.preventDefault();
  const newVal = fileTreeSize.value + e.screenX - startResizeAt.value;
  if (newVal < 500 && newVal > 150) {
    fileTreeSize.value = e.clientX;
  }
};

onMounted(async () => {
  if (!resizeHandle.value) return;
  resizeHandle.value.addEventListener('mousedown', (e) => {
    startResizeAt.value = e.screenX;
    isResizing.value = true;
    window.addEventListener('mousemove', changeFileTreeSize);
    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', changeFileTreeSize);
      startResizeAt.value = 0;
      isResizing.value = false;
    });
  });
});
</script>

<style scoped>
.customCols {
  grid-template-columns: min-content min-content 1fr;
  grid-template-rows: min-content 100%;
}
</style>
