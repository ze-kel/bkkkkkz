<template>
  <div>
    <div class="font-semibold px-2 py-0.5">Tags</div>
    <Tag
      v-for="tag in store.tags"
      :key="tag"
      v-test-class="['T-tag-tree-item', openedTag === tag && 'T-opened-tag']"
      :is-opened="openedTag === tag"
      :tag="tag"
      @click.exact="select(tag, false)"
      @click.alt="select(tag, true)"
    />
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed } from 'vue';
import Tag from './TagFromTree.vue';
import { useStore } from '/@/use/store';
import { cloneDeep as _cloneDeep } from 'lodash';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';

import type { OpenNewOneParams } from '/@/use/store';

const store = useStore();

const openedTag = computed(() => {
  if (!store.openedItem || store.openedItem.type !== 'tag') return null;
  return store.openedItem.thing;
});

const select = (tag: string, newTab: boolean, doNotFocus = false) => {
  const params: OpenNewOneParams = { doNotFocus };
  if (!newTab) params.index = 'current';

  store.openNewOne(
    {
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
