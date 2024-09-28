<template>
  <div ref="baseRef" class="relative">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { InjectionKey, nextTick, onMounted, ref } from 'vue';
import { useFloating, flip, shift, offset, autoUpdate } from '@floating-ui/vue';
import { provide } from 'vue';
import { PROVIDE_KEY } from '.';

const triggerRef = ref();
const floatingRef = ref();
const baseRef = ref();

const props = defineProps({
  closeOnClickInside: {
    type: Boolean,
    default: false,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setTriggerRef = (v: any) => {
  triggerRef.value = v;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setFloatingRef = (v: any) => {
  floatingRef.value = v;
};

const { floatingStyles, update } = useFloating(triggerRef, floatingRef, {
  middleware: [offset(5)],
  whileElementsMounted: autoUpdate,
  placement: 'bottom',
});

const isOpened = ref(false);

const clickHandler = (e: MouseEvent) => {
  const t = e.target as HTMLElement;
  if (!t || !baseRef.value) return;

  if (baseRef.value.contains(t)) {
    return;
  }

  removeEventListener('click', clickHandler);
  close();
};

const open = (e: MouseEvent) => {
  if (!isOpened.value) {
    isOpened.value = true;
    addEventListener('click', clickHandler);
  } else {
    close();
  }
};

const close = () => {
  isOpened.value = false;
};

export type DROPDOWN_PROVIDE = {
  isOpened: typeof isOpened;
  close: typeof close;
  open: typeof open;
  setTriggerRef: typeof setTriggerRef;
  setFloatingRef: typeof setFloatingRef;
  floatingStyles: typeof floatingStyles;
};

provide<DROPDOWN_PROVIDE>(PROVIDE_KEY, {
  isOpened,
  open,
  close,
  setTriggerRef,
  setFloatingRef,
  floatingStyles,
});
</script>
