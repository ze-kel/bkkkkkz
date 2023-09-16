<template>
  <div
    class="absolute bg-neutral-50 dark:bg-neutral-950 truncate rounded-sm text-neutral-50 dark:text-neutral-900 px-2 py-1"
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
