<template>
  <div
    v-test-class="['T-tag-tree-item', isOpened && 'T-opened-tag']"
    class="px-2 py-0.5 border"
    :class="nodeClasses"
    @click.exact="select(tag, false)"
    @click.alt="select(tag, true)"
  >
    #{{ tag }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '/@/use/store';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';

const store = useStore();

const props = defineProps({
  tag: {
    type: String,
    required: true,
  },
});

const isOpened = computed(
  () => store.openedItem && store.openedItem.type === 'tag' && store.openedItem.thing === props.tag,
);

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

const nodeClasses = computed(() => {
  const base = [
    'text-m',
    'whitespace-nowrap',
    'overflow-hidden',
    'rounded',
    'cursor-pointer',
    'font-medium',
    'flex',
    'items-center',
    'outline-0',
    'transition-colors',
    'border-transparent',
  ];
  if (isOpened.value) {
    base.push('bg-indigo-600', 'text-neutral-50', 'hover:bg-indigo-800');
  } else {
    base.push('hover:text-neutral-600 dark:hover:text-neutral-400');
  }

  return base;
});
</script>
