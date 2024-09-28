<template>
  <div
    :class="
      cls(
        'relative z-50 min-w-5 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50 p-1 shadow-md dark:border-neutral-900 dark:bg-neutral-950',
        $attrs.class as string,
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import cls from '~/utils/cls';
</script>
