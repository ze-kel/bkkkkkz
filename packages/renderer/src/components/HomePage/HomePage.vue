<template>
  <div
    class="box-border grid h-full w-full grid-cols-2 items-start gap-4 overflow-y-auto overflow-x-hidden px-2 py-2"
  >
    <CurrentlyReadingVue />

    <ReadingChallenge />
  </div>
</template>

<script lang="ts" setup>
import CurrentlyReadingVue from './CurrentlyReading.vue';
import ReadingChallenge from './ReadingChallenge/ReadingChallenge.vue';
</script>

<style scoped></style>
