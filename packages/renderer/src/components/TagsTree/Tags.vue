<template>
  <div>
    <div class="font-semibold px-2 py-0.5">Tags</div>
    <Tag
      v-for="tag in tags"
      :key="tag"
      :is-opened="openedTag === tag"
      :tag="tag"
      @click="select(tag)"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, getCurrentInstance, computed } from 'vue';
import type { ITags } from '/@main/services/tags';
import { useElectron } from '/@/use/electron';
import type { IOpened } from '/@main/services/watcher';
import type { PropType } from 'vue';
import Tag from './Tag.vue';

const api = useElectron();
const internalInstance = getCurrentInstance();

const tags = ref<ITags>([]);
const saveNewTags = (newTags: ITags) => {
  tags.value = newTags;
};

onMounted(async () => {
  api.subscriptions.TAGS_UPDATE(saveNewTags);
  const start = await api.files.getTags();
  saveNewTags(start);
});

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened | null>,
    default: null,
  },
});

const openedTag = computed(() => {
  if (!props.opened || props.opened.type === 'path') return null;
  return props.opened.thing;
});

const emit = defineEmits<{
  (e: 'select', thing: IOpened): void;
}>();

const select = (tag: string) => {
  internalInstance?.emit('select', { type: 'tag', thing: tag });
};
</script>

<style scoped></style>
