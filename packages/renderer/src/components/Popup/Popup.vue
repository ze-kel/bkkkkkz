<template>
  <div v-if="opened" class="overlay" @click.self="close">
    <div class="popup">
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

<style lang="scss" scoped>
.overlay {
  background: rgba(0, 0, 0, 0.33);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup {
  background: var(--bg-secondary);
  min-width: 450px;
  min-height: 200px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
