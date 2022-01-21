<template>
  <div class="flex flex-col items-center justify-center p-10 h-full">
    <div class="text-4xl">Welcome!</div>
    <div class="mt-2">Please select your root directory</div>
    <button class="basic-button mt-2" @click="clickHandler">Select</button>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
const store = useStore();

const clickHandler = () => {
  store.newRootPath();
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
