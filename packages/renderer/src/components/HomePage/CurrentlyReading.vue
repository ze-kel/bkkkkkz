<template>
  <div class="flex items-center">
    <div class="text-2xl font-semibold">Currently Reading</div>
    <button class="ml-3 basic-button" @click="flipCRShowFull">
      {{
        currentlyReadingCollapsed ? `Show All (+${currentlyReadingArray.length - 4})` : 'Collapse'
      }}
    </button>
  </div>
  <div class="mt-3 grid cards gap-4" :class="currentlyReadingCollapsed && 'hideFull'">
    <BookItem
      v-for="item in currentlyReadingArray"
      :key="item.path"
      class="singleCard"
      :current-file="item"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useElectron } from '/@/use/electron';

import BookItem from '/@/components/BookView/BookItem.vue';

import type { IFile, IFiles } from '/@main/services/files';
import { trpcApi } from '/@/utils/trpc';

const api = useElectron();

const currentlyReading = ref<IFiles>({});
const currentlyReadingArray = computed<IFile[]>(() => {
  return Object.values(currentlyReading.value);
});
const currentlyReadingShowFull = ref(false);
const flipCRShowFull = () => {
  currentlyReadingShowFull.value = !currentlyReadingShowFull.value;
};
const currentlyReadingCollapsed = computed(
  () => currentlyReadingArray.value.length > 4 && !currentlyReadingShowFull.value,
);

const load = async () => {
  currentlyReading.value = await trpcApi.loadFilesFromTag.query('_i_reading');
  console.log(currentlyReading.value);
};

load();
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  grid-auto-rows: max-content;
}

.hideFull > .singleCard:nth-child(4) ~ .singleCard {
  display: none;
}
</style>
