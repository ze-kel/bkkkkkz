<template>
  <div class="flex h-full flex-col items-center justify-center p-10">
    <div class="text-4xl">Welcome!</div>
    <div class="mt-2">Please select your root directory</div>
    <button class="mt-2" @click="clickHandler">Select</button>
  </div>
</template>

<script lang="ts" setup>
import { trpcApi } from '/@/utils/trpc';

const clickHandler = () => {
  trpcApi.setRootPath.mutate();
};
</script>

<style scoped>
.root {
  background: var(--bg-main);
  display: flex;
  align-items: center;
  padding: 100px;
  border-radius: 5px;
}

.text {
  margin-top: 5px;
}

.button {
  width: 100%;
  border: none;
  margin-top: 10px;
  padding: 5px;
  border-radius: 4px;
  background: var(--accent-main-grad);
  cursor: pointer;
}
</style>
