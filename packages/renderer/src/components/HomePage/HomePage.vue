<template>
  <div class="w-full h-full box-border overflow-y-auto overflow-x-hidden px-2 items-start py-2">
    <div class="my-1 p-2 border border-neutral-200 dark:border-neutral-800 rounded-sm">
      <CurrentlyReadingVue />
    </div>
    <div class="my-2 p-2 border border-neutral-200 dark:border-neutral-800 rounded-sm">
      <ReadingChallenge />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CurrentlyReadingVue from './CurrentlyReading.vue';
import ReadingChallenge from './ReadingChallenge/ReadingChallenge.vue';
</script>

<style scoped></style>
