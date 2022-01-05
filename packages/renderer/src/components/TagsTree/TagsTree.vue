<template>
  <div>
    <div class="font-semibold px-2 py-0.5">Tags</div>
    <Tag
      v-for="tag in store.tags"
      :key="tag"
      :is-opened="openedTag === tag"
      :tag="tag"
      @click="select(tag, false)"
      @click.alt="select(tag, true)"
    />
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed } from 'vue';
import { useElectron } from '/@/use/electron';
import Tag from './TagFromTree.vue';
import { useStore } from '/@/use/store';
import type { IOpenedTag } from '/@main/services/watcher';

const api = useElectron();
const internalInstance = getCurrentInstance();
const store = useStore();

const openedTag = computed(() => {
  if (!store.openedItem || store.openedItem.type !== 'tag') return null;
  return store.openedItem.thing;
});

const select = (tag: string, newTab: boolean) => {
  const newOne: IOpenedTag = { type: 'tag', thing: tag };
  if (newTab || store.activeOpenedIndex === null) {
    store.addOpened(newOne);
  } else {
    store.updateOpened(store.activeOpenedIndex, newOne);
  }
};
</script>

<style scoped></style>
