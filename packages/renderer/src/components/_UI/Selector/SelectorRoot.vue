<template>
  <div ref="reference" :class="$attrs.class" class="" @click.stop="openMenu">
    <BasicButton class="w-full justify-between" variant="outline">
      {{ modelValue }}

      <ChevronDown class="w-4 opacity-50"></ChevronDown>
    </BasicButton>
  </div>

  <MenuRoot v-if="isOpened" ref="floatingRef" :style="floatingStyles"> <slot></slot></MenuRoot>
</template>

<script lang="ts" setup>
import type { VNodeRef } from 'vue';
import { InjectionKey, onMounted, ref } from 'vue';
import { useFloating, flip, shift, offset } from '@floating-ui/vue';
import { provide } from 'vue';
import { PROVIDE_KEY } from './';
import BasicButton from '../BasicButton.vue';

import { useVModel } from '@vueuse/core';
import { MenuRoot } from '/@/components/_UI/GenericMenu';
import { ChevronDown } from 'lucide-vue-next';

// TODO: SPLIT BASIC MODAL INTO A SEPARATE REUSABLE COMPONENT

const props = defineProps<{
  modelValue: string;
}>();
const emit = defineEmits(['update:modelValue']);

const value = useVModel(props, 'modelValue', emit);

const reference = ref();
const floatingRef = ref();

const { floatingStyles, update } = useFloating(reference, floatingRef, {
  middleware: [offset(5), flip(), shift()],
  placement: 'bottom',
});

const isOpened = ref(false);

const outsideClickHandler = (e: MouseEvent) => {
  removeEventListener('click', outsideClickHandler);
  closeMenu();
};

const openMenu = (e: MouseEvent) => {
  if (!isOpened.value) {
    isOpened.value = true;
    addEventListener('click', outsideClickHandler);
  } else {
    closeMenu();
  }
};

const closeMenu = () => {
  isOpened.value = false;
};

export type SELECTOR_PROVIDE = {
  isOpened: typeof isOpened;
  closeMenu: typeof closeMenu;
  openMenu: typeof openMenu;
  selectValue: typeof value;
};

provide<SELECTOR_PROVIDE>(PROVIDE_KEY, {
  isOpened,
  closeMenu,
  openMenu,
  selectValue: value,
});
</script>
