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
import Tag from './TagFromTree.vue';
import { cloneDeep as _cloneDeep } from 'lodash';
import type { Unsubscribable } from 'type-fest';
import { computed, onBeforeMount, onMounted, onUnmounted } from 'vue';
import { trpcApi } from '/@/utils/trpc';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '/@/use/store';
import TreeCell from '/@/components/FileTree/TreeCell.vue';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';
import { testClasses } from '/@/utils/testClassBinds';

const store = useStore();

const dataSorted = computed(() =>
  store.tagsTree ? [...store.tagsTree].sort((a, b) => a.localeCompare(b)) : undefined,
);

const toUnsub: Unsubscribable[] = [];

onBeforeMount(async () => {
  await store.fetchTags();
});

onMounted(async () => {
  const s1 = trpcApi.tagsUpdate.subscribe(undefined, { onData: store.updateTags });
  toUnsub.push(s1);
});

onUnmounted(async () => {
  toUnsub.forEach((s) => s.unsubscribe());
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
