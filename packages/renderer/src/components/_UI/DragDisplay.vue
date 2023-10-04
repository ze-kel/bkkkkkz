<template>
  <div
    class="absolute max-w-md truncate rounded-md border border-neutral-400 bg-neutral-50 px-2 py-1 text-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
  >
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';

const store = useStore();

const props = defineProps({
  text: {
    type: String,
    required: false,
    default: '',
  },
});
</script>
