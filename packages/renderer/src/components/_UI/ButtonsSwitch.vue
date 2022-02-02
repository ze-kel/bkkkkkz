<template>
  <div class="flex w-fit rounded-sm border-neutral-900 dark:border-neutral-50 border">
    <div
      v-for="option in options"
      :key="option.key"
      class="px-2 py-1 transition-colors"
      :class="
        modelValue === option.key
          ? 'dark:bg-neutral-50 dark:text-neutral-900 bg-neutral-900 text-neutral-50'
          : 'cursor-pointer'
      "
      @click="emitKey(option)"
    >
      {{ option.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

export type ISwitchOption = { key: string | number; label: string };

const props = defineProps({
  options: {
    type: Array as PropType<ISwitchOption[]>,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', key: string | number | object | symbol): void;
}>();

const emitKey = (option: ISwitchOption) => {
  console.log('emitting', option.key);
  emit('update:modelValue', option.key);
};
</script>

<style scoped></style>
