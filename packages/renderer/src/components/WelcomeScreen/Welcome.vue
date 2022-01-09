<template>
  <div class="root">
    <div class="header-XL bold">Welcome!</div>
    <div class="text text-L">Please select your root directory</div>
    <button class="button bold" @click="store.newRootPath">Select</button>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
const store = useStore();
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
