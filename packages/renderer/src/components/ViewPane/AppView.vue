<template>
  <div class="w-full h-full flex flex-col">
    <TabsSelector></TabsSelector>
    <div
      v-if="store.openedItem && typeof store.opened.active === 'number'"
      :key="store.openedItem.thing + store.opened.active"
      class="w-full h-[calc(100%_-_32px)]"
    >
      <template v-if="store.openedItem.type === 'innerPage'">
        <HomePage v-if="store.openedItem.thing === 'home'" />
      </template>
      <template v-else>
        <Editor
          v-if="store.openedItem.type === 'file' || store.openedItem.type === 'newFile'"
          :opened="store.openedItem"
          :index="store.opened.active" />
        <BookView v-else :opened="store.openedItem" :index="store.opened.active"
      /></template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BookView from '/@/components/BookView/BookView.vue';
import Editor from '../Editor/BookEditor.vue';
import HomePage from '../HomePage/HomePage.vue';
import TabsSelector from './TabsSeletor.vue';
import { useStore } from '/@/use/store';

const store = useStore();
</script>
