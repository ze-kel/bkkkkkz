<template>
  <div
    :class="[
      'py-1 h-10 flex items-center justify-between border-transparent transition-all',
      widthAwailable > 100 ? 'px-2 text-sm' : 'px-1 text-xs',
      isActive
        ? 'dark:bg-neutral-950 bg-neutral-50 rounded-tl-md rounded-tr-md'
        : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-800',
    ]"
  >
    <div v-test-class="'T-label'" class="truncate" :class="isNewAndAnimating && 'animate-new'">
      {{ text }}
    </div>

    <BasicButton variant="ghost" size="iconSm" @mousedown.stop @click.stop="emit('close')">
      <XIcon class="duration-[0] text-neutral-300 dark:text-neutral-600" />
    </BasicButton>
  </div>
</template>

<script lang="ts" setup>
import { XIcon } from 'lucide-vue-next';
import BasicButton from '/@/components/_UI/BasicButton.vue';
import { onRenderTracked } from 'vue';


const props = defineProps({
  isNewAndAnimating: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  widthAwailable: {
    type: Number,
    default: 150,
  },
});
const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style>
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
