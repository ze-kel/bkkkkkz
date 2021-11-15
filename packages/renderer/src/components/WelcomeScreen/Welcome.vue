<template>
  <div class="root">
    <div class="header-XL bold">Welcome!</div>
    <div class="text text-L">Please select your root directory</div>
    <button class="button bold" @click="$emit('setPath')">Select</button>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'setPath'): void;
}>();
</script>

<style lang="scss" scoped>
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
