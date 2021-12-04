<template>
  <div class="tags">
    <div class="name text-L">Tags</div>
    <div
      v-for="tag in tags"
      :key="tag"
      :class="['tag', openedTag === tag && 'opened']"
      @click="select(tag)"
    >
      {{ tag }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, getCurrentInstance, computed } from 'vue';
import type { ITags } from '/@main/services/tags';
import { useElectron } from '/@/use/electron';
import type { IOpened } from '/@main/services/watcher';
import type { PropType } from 'vue';

const api = useElectron();
const internalInstance = getCurrentInstance();

const tags = ref<ITags>([]);
const saveNewTags = (newTags: ITags) => {
  console.log('savenew', newTags);
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

<style lang="scss" scoped>
.tag {
  display: flex;
  flex-direction: column;
}

.tag {
  cursor: pointer;
  border-bottom: 2px solid transparent;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 8px;
  font-size: 14px;
  border-radius: 3px;
  box-sizing: border-box;
  white-space: nowrap;

  font-weight: 400;

  &.opened {
    background: var(--accent-main);
  }
}

.name {
  padding: 2px 8px;
  font-weight: 700;
}
</style>
