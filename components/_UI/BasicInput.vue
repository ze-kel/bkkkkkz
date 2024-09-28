<script setup lang="ts">
import { cva } from 'class-variance-authority';
import cls from '~/utils/cls';
import { useVModel } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { NUMBERS_REGEX } from '~/server/helpers/utils';

const inputVariants = cva(
  [
    'min-h-8 flex w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-all',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300',
    'placeholder:text-neutral-500 dark:placeholder:text-neutral-400  disabled:cursor-not-allowed disabled:opacity-50  ',
  ],
  {
    variants: {
      theme: {
        default: 'border-neutral-200 dark:border-neutral-800',
        hidden:
          'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 focus:border-neutral200 dark:focus:border-neutral-800',
      },
    },
    defaultVariants: {
      theme: 'default',
    },
  },
);

const props = defineProps<{
  modelValue: string | number | undefined;
  theme?: NonNullable<Parameters<typeof inputVariants>[0]>['theme'];
  type?: HTMLInputElement['type'];
  placeholder?: string;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number | undefined): void;
}>();

const innerValue = ref(props.modelValue);

watch(innerValue, () => {
  const val = innerValue.value;

  if (typeof val === 'undefined') {
    emits('update:modelValue', undefined);
  }
  if (props.type === 'number') {
    emits('update:modelValue', Number(val));
  } else {
    emits('update:modelValue', val);
  }
});

watch(
  () => props.modelValue,
  (v) => {
    if (v !== innerValue.value) {
      innerValue.value = v;
    }
  },
);
</script>

<template>
  <input
    v-model="innerValue"
    v-bind="$attrs"
    :placeholder="placeholder"
    :type="props.type || 'text'"
    :class="cls(inputVariants({ theme }), $attrs.class as string)"
  />
</template>
