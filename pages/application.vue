<template>
  <div v-if="store.openedItem" :key="store.openedItem.id" class="h-full w-full">
    <template v-if="store.openedItem.type === 'innerPage'"> home page is deprecated </template>
    <template v-else>
      <BookEditor v-if="store.openedItem.type === 'file'" :opened="store.openedItem" />
      <TableView v-else :opened="store.openedItem" :index="store.openedTabsActiveIndex || 0" />
    </template>
  </div>

  <PlaceholdersNoTabPlaceholder v-else />
</template>

<script setup lang="ts">
import { debounce as _debounce } from 'lodash';

import { useStore } from '~~/utils/store';
import BookEditor from '~/components/Editor/BookEditor.vue';
import TableView from '~/components/BookView/BooksView.vue';

const store = useStore();

definePageMeta({
  layout: 'app',
});
</script>
