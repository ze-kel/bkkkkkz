<template>
  <slot />
</template>

<script lang="ts" setup>
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';
import type { MaybeElement } from '@floating-ui/vue';
import { useFloating, flip, shift } from '@floating-ui/vue';
import { provide } from 'vue';
import { PROVIDE_KEY } from '~/components/_UI/ContextMenu';

const reference = ref<unknown>(null);

const floatingRef = ref<Element | null>(null);
const triggerRef = ref<Element | null>(null);

const setFloatingRef = (el: typeof floatingRef.value) => {
  floatingRef.value = el;
};

const setTriggerRef = (el: typeof triggerRef.value) => {
  triggerRef.value = el;
};

const { floatingStyles, update } = useFloating(
  reference as Ref<MaybeElement<HTMLElement>>,
  floatingRef as Ref<MaybeElement<HTMLElement>>,
  {
    middleware: [flip(), shift()],
    placement: 'bottom-start',
  },
);

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
  // If we've clicked on the same element it will just rerun openMenu and update position
  // Looking at target not isOpened to prevent instant closing from event bubbling
  // (stopping propagation for rightclick is bad becuase then we'll be able to open multiple context menus)
  if (triggerRef.value instanceof Element && e.target instanceof Element) {
    if (triggerRef.value.contains(e.target)) return;
  }

  removeEventListener('click', outsideClickHandler);
  removeEventListener('contextmenu', outsideClickHandler);
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
    addEventListener('contextmenu', outsideClickHandler);
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
  triggerRef: typeof triggerRef;
  setTriggerRef: typeof setTriggerRef;
};

provide<CONTEXT_MENU_PROVIDE>(PROVIDE_KEY, {
  openMenu,
  closeMenu,
  isOpened,
  floatingStyles,
  setFloatingRef,
  triggerRef,
  setTriggerRef,
});
</script>
