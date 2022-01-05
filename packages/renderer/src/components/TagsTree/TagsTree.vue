<template>
  <div>
    <div class="font-semibold px-2 py-0.5">Tags</div>
    <Tag
      v-for="tag in store.tags"
      :key="tag"
      :is-opened="openedTag === tag"
      :tag="tag"
      @click="select(tag)"
    />
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed } from 'vue';
import { useElectron } from '/@/use/electron';
import Tag from './TagFromTree.vue';
import { useStore } from '/@/use/store';

const api = useElectron();
const internalInstance = getCurrentInstance();
const store = useStore();

const openedTag = computed(() => {
  if (!store.opened || store.opened.type === 'path') return null;
  return store.opened.thing;
});

const select = (tag: string) => {
  store.newOpened({ type: 'tag', thing: tag });
};
</script>

<style scoped></style>
