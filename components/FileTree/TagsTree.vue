<template>
  <div>
    <TreeCell
      v-for="tag in dataSorted"
      :key="tag"
      :name="tag"
      :is-tag="true"
      :selected="openedTag === tag"
      @click.exact="select(tag, { place: 'current', focus: true })"
      @click.alt="select(tag, { place: 'next' })"
    />
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep as _cloneDeep } from 'lodash';
import { computed, onBeforeMount, onMounted, onUnmounted } from 'vue';
import { useStore } from '~~/utils/store';
import TreeCell from '~/components/FileTree/TreeCell.vue';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';

import { apiEventsEmitter } from '~/api/events';
import { getAllTags } from '~/api/watcher/metaCache';

import { invoke } from '@tauri-apps/api/core';

const store = useStore();
const { data, refresh } = useAsyncData(() => {
  return invoke('c_get_all_tags') as Promise<string[]>;
});

const dataSorted = computed(() =>
  data.value ? [...data.value].sort((a, b) => a.localeCompare(b)) : undefined,
);

onMounted(async () => {
  apiEventsEmitter.addListener('META_UPDATE', refresh);
});

onUnmounted(() => {
  apiEventsEmitter.removeListener('META_UPDATE', refresh);
});

const openedTag = computed(
  () => store.openedItem && store.openedItem.type === 'tag' && store.openedItem.thing,
);

const select = (tag: string, params: OpenNewOneParams) => {
  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'tag',
      thing: tag,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
    },
    params,
  );
};
</script>

<style scoped></style>
