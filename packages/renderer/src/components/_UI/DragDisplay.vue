<template>
  <div
    class="absolute bg-indigo-500 truncate rounded-sm text-neutral-50 dark:text-neutral-900 px-2 py-1"
  >
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  text: {
    type: String,
    required: false,
    default: '',
  },
});
</script>
