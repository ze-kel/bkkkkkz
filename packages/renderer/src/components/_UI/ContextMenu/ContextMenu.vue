<template>
  <slot />
</template>

<script lang="ts" setup>
import type { VNodeRef } from 'vue';
import { InjectionKey, onMounted, ref } from 'vue';
import { useFloating, flip, shift } from '@floating-ui/vue';
import { provide } from 'vue';
import { PROVIDE_KEY } from '/@/components/_UI/ContextMenu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reference = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const floatingRef = ref<any>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setFloatingRef = (el: any) => {
  floatingRef.value = el;
};

const { floatingStyles, update } = useFloating(reference, floatingRef, {
  middleware: [flip(), shift()],
  placement: 'bottom-start',
});

const isOpened = ref(false);

const position = ref({
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 20,
  right: 20,
  width: 20,
  height: 20,
});

onMounted(() => {
  reference.value = {
    getBoundingClientRect() {
      return position.value;
    },
  };
});

const outsideClickHandler = (e: MouseEvent) => {
  removeEventListener('click', outsideClickHandler);
  closeMenu();
};

const openMenu = (e: MouseEvent) => {
  const { clientX, clientY } = e;

  position.value = {
    width: 0,
    height: 0,
    x: clientX,
    y: clientY,
    top: clientY,
    left: clientX,
    right: clientX,
    bottom: clientY,
  };

  if (!isOpened.value) {
    isOpened.value = true;
    addEventListener('click', outsideClickHandler);
  } else {
    update();
  }
};

const closeMenu = () => {
  isOpened.value = false;
};

export type CONTEXT_MENU_PROVIDE = {
  openMenu: typeof openMenu;
  closeMenu: typeof closeMenu;
  isOpened: typeof isOpened;
  floatingStyles: typeof floatingStyles;
  setFloatingRef: typeof setFloatingRef;
};

provide<CONTEXT_MENU_PROVIDE>(PROVIDE_KEY, {
  openMenu,
  closeMenu,
  isOpened,
  floatingStyles,
  setFloatingRef,
});
</script>
