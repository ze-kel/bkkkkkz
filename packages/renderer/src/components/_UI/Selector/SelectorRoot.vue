<template>
  <DropdownRoot>
    <DropdownTrigger :class="$attrs.class">
      <BasicButton class="w-full justify-between" variant="outline">
        {{ modelValue }}

        <ChevronDown class="w-4 opacity-50"></ChevronDown>
      </BasicButton>
    </DropdownTrigger>

    <DropdownContent>
      <MenuRoot>
        <slot></slot>
      </MenuRoot>
    </DropdownContent>
  </DropdownRoot>
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

import { DropdownContent, DropdownRoot, DropdownTrigger } from '/@/components/_UI/DropdownGeneric';

// TODO: SPLIT BASIC MODAL INTO A SEPARATE REUSABLE COMPONENT

const props = defineProps<{
  modelValue: string;
}>();
const emit = defineEmits(['update:modelValue']);

const value = useVModel(props, 'modelValue', emit);

export type SELECTOR_PROVIDE = {
  selectValue: typeof value;
};

provide<SELECTOR_PROVIDE>(PROVIDE_KEY, {
  selectValue: value,
});
</script>
