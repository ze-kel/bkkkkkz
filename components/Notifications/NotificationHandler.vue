<template>
  <div class="absolute bottom-10 right-10 flex flex-col gap-4">
    <div
      v-for="(item, i) in store.notifications"
      :key="i"
      class="animate-new relative w-[30rem] flex-col rounded-md border border-neutral-100 bg-neutral-50 p-4 font-semibold shadow-md transition-all dark:border-neutral-900 dark:bg-neutral-950"
    >
      <div class="jusify-between flex gap-4">
        <div class="text-md w-[90%]">
          {{ item.title }}
        </div>

        <BasicButton
          variant="outline"
          size="iconSm"
          class="absolute right-4 top-4"
          @click="store.removeNotifcation(item.id)"
        >
          <XIcon class="w-4" />
        </BasicButton>
      </div>
      <div class="mt-2 flex flex-col text-sm">
        <template v-if="typeof item.text === 'string'">
          {{ item.text }}
        </template>
        <template v-else>
          <span v-for="(t, index) in item.text" :key="index"> {{ t }}</span>
        </template>
      </div>
      <div class="mt-1 text-xs">
        {{ item.subtext }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XIcon } from 'lucide-vue-next';
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';

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
