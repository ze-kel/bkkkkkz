<template>
  <div
    :class="[
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer',
    ]"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts"></script>
