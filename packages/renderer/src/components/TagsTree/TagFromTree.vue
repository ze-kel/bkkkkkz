<template>
  <BasicButton
    v-test-class="[testClasses.tagTreeItem]"
    :variant="isOpened ? 'default' : 'ghost'"
    size="compact"
    class="w-full justify-start"
    @click.exact="select(tag, { place: 'current', focus: true })"
    @click.alt="select(tag, { place: 'next' })"
  >
    #{{ tag }}
  </BasicButton>
</template>

<script lang="ts" setup>
import { cva } from 'class-variance-authority';
import { computed } from 'vue';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '/@/use/store';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';
import { testClasses } from '/@/utils/testClassBinds';
import BasicButton from '/@/components/_UI/BasicButton/BasicButton.vue';

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

const nodeClasses = cva(
  [
    `p-1 mt-0.5 flex items-center text-m whitespace-nowrap overflow-hidden
    rounded text-sm font-medium outline-0 transition-colors`,
  ],
  {
    variants: {
      opened: {
        true: 'text-neutral-800 dark:text-neutral-50 cursor-default',
        false: 'cursor-pointer text-neutral-400 dark:text-neutral-500',
      },
      canDropHere: {
        true: 'bg-neutral-800 dark:bg-neutral-200',
      },
    },
  },
);
</script>
