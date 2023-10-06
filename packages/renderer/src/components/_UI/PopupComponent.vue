<template>
  <div
    v-if="opened"
    class="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-neutral-800 bg-opacity-75"
    @mousedown.self="close"
  >
    <div
      class="popup flex items-center justify-center rounded-lg bg-neutral-50 p-8 shadow-md dark:bg-neutral-900"
      @click.stop=""
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
  emit('close');
};
</script>

<style scoped>
.popup {
  min-width: 450px;
  min-height: 200px;
  box-sizing: border-box;
}
</style>
