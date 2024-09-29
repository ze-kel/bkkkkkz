<template>
  <div>
    <TreeCell
      v-for="tag in dataSorted"
      :key="tag"
      v-test-class="[testClasses.tagTreeItem]"
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
import type { Unsubscribable } from 'type-fest';
import { computed, onBeforeMount, onMounted, onUnmounted } from 'vue';
const { $trpc } = useNuxtApp();
import { useStore } from '~~/utils/store';
import TreeCell from '~/components/FileTree/TreeCell.vue';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';
import { testClasses } from '~/tools/tests/binds';

const store = useStore();

const dataSorted = computed(() =>
  store.tagsTree ? [...store.tagsTree].sort((a, b) => a.localeCompare(b)) : undefined,
);

onBeforeMount(async () => {
  await store.fetchTags();
});

onMounted(async () => {});

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
