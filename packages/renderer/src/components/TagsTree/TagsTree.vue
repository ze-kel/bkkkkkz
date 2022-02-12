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
import _cloneDeep from 'lodash-es/cloneDeep';
import type { IOpenedTag, IViewSettings } from '/@main/services/watcher';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';

const api = useElectron();
const store = useStore();

const openedTag = computed(() => {
  if (!store.openedItem || store.openedItem.type !== 'tag') return null;
  return store.openedItem.thing;
});

const select = (tag: string, newTab: boolean) => {
  if (newTab || store.activeOpenedIndex < 0) {
    store.addOpened('tag', tag);
  } else {
    store.updateOpened(store.activeOpenedIndex, 'tag', tag);
  }
};
</script>

<style scoped></style>
