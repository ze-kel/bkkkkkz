<template>
  <div class="absolute top-0 left-0 h-8 w-full z-50"></div>
  <div
    v-if="opened"
    class="bg-gray-800 bg-opacity-75 absolute top-0 left-0 w-full h-full flex items-center justify-center z-10"
    @mousedown.self="close"
  >
    <div class="bg-white flex items-center justify-center p-8 rounded popup" @click.stop="">
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
