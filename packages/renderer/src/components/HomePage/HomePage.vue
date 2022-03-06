<template>
  <div class="w-full h-full box-border overflow-y-auto overflow-x-hidden px-2 items-start py-2">
    <div class="text-3xl">Hello</div>

    <div>You've read</div>
    <div class="flex gap-3 my-2">
      <div class="shadow shadow-white py-2 px-4 rounded-sm">
        <div>This year</div>
        <div class="text-4xl font-semibold">65</div>
        <div>Books</div>
      </div>

      <div>You've read N books total</div>
    </div>

    <div>Curently reading:</div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const currentlyReading = ref([]);
</script>

<style></style>
