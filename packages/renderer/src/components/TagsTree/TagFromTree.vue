<template>
  <div v-test-class="'T-label'" class="px-2 py-0.5 border" :class="nodeClasses">#{{ tag }}</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps({
  tag: {
    type: String,
    required: true,
  },
  isOpened: {
    type: Boolean,
    default: false,
  },
});

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
  if (props.isOpened) {
    base.push('bg-indigo-600', 'text-neutral-50 dark:text-neutral-900', 'hover:bg-indigo-800');
  } else {
    base.push('hover:text-neutral-600');
  }

  return base;
});
</script>
