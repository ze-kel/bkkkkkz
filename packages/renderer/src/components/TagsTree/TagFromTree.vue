<template>
  <div
    v-test-class="['T-tag-tree-item', isOpened && 'T-opened-tag']"
    :class="nodeClasses({ opened: isOpened, canDropHere: false })"
    @click.exact="select(tag, false)"
    @click.alt="select(tag, true)"
  >
    #{{ tag }}
  </div>
</template>

<script lang="ts" setup>
import { cva } from 'class-variance-authority';
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

const nodeClasses = cva(
  [
    `p-1 mt-0.5 flex items-center text-m whitespace-nowrap overflow-hidden
    rounded text-sm font-medium outline-0 transition-colors`,
  ],
  {
    variants: {
      opened: {
        true: ' text-neutral-800 dark:text-neutral-300',
        false: 'cursor-pointer text-neutral-700 dark:text-neutral-400',
      },
      canDropHere: {
        true: '',
      },
    },
    compoundVariants: [
      {
        opened: true,
        canDropHere: false,
        class: 'bg-neutral-300 dark:bg-neutral-600',
      },
      {
        opened: false,
        canDropHere: false,
        class: 'hover:bg-neutral-200 dark:hover:bg-neutral-700',
      },
      {
        opened: true,
        canDropHere: true,
        class: 'bg-neutral-200 dark:bg-neutral-500',
      },
      {
        opened: false,
        canDropHere: true,
        class: 'bg-neutral-200 dark:bg-neutral-500',
      },
    ],
  },
);
</script>
