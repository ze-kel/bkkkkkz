<template>
  <div class="absolute bottom-10 right-10 flex flex-col gap-4">
    <div
      v-for="(item, i) in store.notifications"
      :key="i"
      class="animate-new w-64 flex-col rounded-md border border-neutral-100 bg-neutral-50 p-4 font-semibold shadow-md transition-all dark:border-neutral-900 dark:bg-neutral-950"
    >
      <div class="text-md">
        {{ item.title }}
      </div>
      <div class="text-sm">
        {{ item.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '../../use/store';
const store = useStore();
</script>

<style scoped>
.animate-new {
  animation-duration: 0.3s;
  animation-name: tabOpenAnimation;
  animation-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes tabOpenAnimation {
  0% {
    opacity: 0;
    transform: translateY(50%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
