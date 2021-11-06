<template>
  <div class="smallInput">
    <div class="text-S text">{{ text }}</div>
    <input v-if="value" v-model="proxyValue" type="number" class="input header-S" />
    <font-awesome-icon v-else icon="plus" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';

const internalInstance = getCurrentInstance();

const props = defineProps({
  value: {
    type: Number,
    default: null,
  },
  text: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'update', newRating: number): void;
}>();

const proxyValue = computed({
  get: () => props.value,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update', val);
  },
});
</script>

<style lang="scss" scoped>
.smallInput {
  width: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .text {
    color: var(--accent-secondary);
  }

  .input {
    text-align: center;
    -webkit-appearance: none;
    width: 100%;
  }
}
</style>
