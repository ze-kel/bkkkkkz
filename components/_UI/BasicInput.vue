<script setup lang="ts">
import { templateRef, useTextareaAutosize } from '@vueuse/core';
import { cva } from 'cva';

const inputVariants = cva({
  base: [
    'min-h-8 flex w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-all',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300',
    'placeholder:text-neutral-500 dark:placeholder:text-neutral-400  disabled:cursor-not-allowed disabled:opacity-50  ',
  ],
  variants: {
    theme: {
      Default: 'border-neutral-200 dark:border-neutral-800',
      Hidden:
        'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 focus:border-neutral200 dark:focus:border-neutral-800',
    },
    size: {
      L: 'text-4xl',
      M: 'text-xl',
      S: '',
    },
    font: {
      Serif: 'font-serif',
      Sans: 'font-sans',
    },
    weight: {
      Light: 'font-light',
      Normal: 'font-normal',
      Bold: 'font-bold',
      Black: 'font-black',
    },
  },
  defaultVariants: {
    theme: 'Default',
    size: 'S',
    font: 'Sans',
  },
});

const props = defineProps<{
  modelValue: string | number | undefined;

  theme?: NonNullable<Parameters<typeof inputVariants>[0]>['theme'];
  size?: NonNullable<Parameters<typeof inputVariants>[0]>['size'];
  weight?: NonNullable<Parameters<typeof inputVariants>[0]>['weight'];
  font?: NonNullable<Parameters<typeof inputVariants>[0]>['font'];

  type?: HTMLInputElement['type'];
  placeholder?: string;

  multiLine?: boolean;
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

const textAreaRef = templateRef('textAreaRef');

useTextareaAutosize({
  element: textAreaRef,
  watch: [innerValue],
  styleProp: 'height',
});
</script>

<template>
  <textarea
    v-if="props.multiLine"
    ref="textAreaRef"
    v-model="innerValue"
    :class="
      cn(
        inputVariants({ theme, size, font, weight }),
        $attrs.class as string,
        'box-border resize-none transition-none',
      )
    "
    :placeholder="placeholder"
    :type="props.type || 'text'"
  >
  </textarea>
  <input
    v-else
    v-model="innerValue"
    v-bind="$attrs"
    :placeholder="placeholder"
    :type="props.type || 'text'"
    :class="cn(inputVariants({ theme, size, font, weight }), $attrs.class as string)"
  />
</template>

<style>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>
