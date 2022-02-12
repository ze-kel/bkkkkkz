<template>
  <div class="flex w-fit rounded-sm border-neutral-900 dark:border-neutral-50 border">
    <div
      v-for="option in options"
      :key="option.key"
      class="transition-colors px-2 py-1"
      :class="[
        modelValue === option.key
          ? 'bg-neutral-900 dark:bg-neutral-50   dark:text-neutral-900  text-neutral-50 fill-neutral-50 dark:fill-neutral-900'
          : 'cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-600  fill-neutral-900 dark:fill-neutral-50',
        optionClasses,
      ]"
      @click="emitKey(option)"
    >
      <slot name="option" v-bind="option"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

export type ISwitchOption = { key: string | number; [key: string]: unknown };

const props = defineProps({
  options: {
    type: Array as PropType<ISwitchOption[]>,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  optionClasses: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', key: any): void;
}>();

const emitKey = (option: ISwitchOption) => {
  emit('update:modelValue', option.key);
};
</script>

<style scoped></style>
