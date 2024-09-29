<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="text-xl font-semibold">Currently Reading</div>
      <BasicButton variant="ghost" size="sm" class="ml-3" @click="flipCRShowFull">
        {{
          currentlyReadingCollapsed ? `Show All (+${currentlyReadingArray.length - 4})` : 'Collapse'
        }}
      </BasicButton>
    </div>
    <div class="cards mt-3 grid gap-2" :class="currentlyReadingCollapsed && 'hideFull'">
      <BookItem
        v-for="item in currentlyReadingArray"
        :key="item.path"
        class="singleCard"
        :current-file="item"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import BookItem from '~/components/BookView/BookItemWrapper.vue';

import type { IFile, IFiles } from '~/api/files';
const { $trpc } = useNuxtApp();
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';

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
  currentlyReading.value = await $trpc.loadFilesFromTag.query('_i_reading');
};

load();
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  grid-auto-rows: max-content;
}

.hideFull > .singleCard:nth-child(4) ~ .singleCard {
  display: none;
}
</style>
