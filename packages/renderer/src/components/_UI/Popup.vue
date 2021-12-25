<template>
  <div
    v-if="opened"
    class="
      bg-gray-800 bg-opacity-25
      absolute
      top-0
      left-0
      w-full
      h-full
      flex
      items-center
      justify-center
      z-50
    "
    @mousedown.self="close"
  >
    <div class="bg-white flex items-center justify-center p-8 rounded-lg popup" @click.stop="">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance } from 'vue';

const internalInstance = getCurrentInstance();

const props = defineProps({
  opened: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const close = () => {
  internalInstance?.emit('close');
};
</script>

<style scoped>
.popup {
  min-width: 450px;
  min-height: 200px;
  box-sizing: border-box;
}
</style>
