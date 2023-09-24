<template>
  <div class="box-border h-full w-full items-start overflow-y-auto overflow-x-hidden px-2 py-2">
    <div class="my-1">
      <CurrentlyReadingVue />
    </div>
    <div class="my-2">
      <ReadingChallenge />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CurrentlyReadingVue from './CurrentlyReading.vue';
import ReadingChallenge from './ReadingChallenge/ReadingChallenge.vue';
</script>

<style scoped></style>
