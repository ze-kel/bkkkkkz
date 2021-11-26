<template>
  <button class="btn" @click="emit('click')">{{ text }}</button>
</template>

<script lang="ts" setup>
const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style lang="scss" scoped>
.btn {
  border: none;
  background: var(--accent-main-grad);
  padding: 6px 12px;
  border-radius: 3px;
  cursor: pointer;
}
</style>
