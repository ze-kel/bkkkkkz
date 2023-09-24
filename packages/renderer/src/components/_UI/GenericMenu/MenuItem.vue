<template>
  <div
    :class="
      classMerge(
        'relative flex cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none',
        'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900',
        $attrs.class as string,
      )
    "
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import classMerge from '/@/utils/classMerge';
</script>
