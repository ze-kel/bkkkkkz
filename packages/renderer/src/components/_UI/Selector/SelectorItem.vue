<template>
  <MenuItem @click="clickHandler">
    <div class="flex w-8 items-center">
      <CheckIcon v-if="isSelected" class="w-4"></CheckIcon>
    </div>
    <slot></slot>
  </MenuItem>
</template>

<script setup lang="ts">
import { MenuItem } from '/@/components/_UI/GenericMenu';

import { PROVIDE_KEY } from './';
import { computed, inject } from 'vue';
import { MenuRoot } from '/@/components/_UI/GenericMenu';
import type { SELECTOR_PROVIDE } from '/@/components/_UI/Selector/SelectorRoot.vue';
import { CheckIcon } from 'lucide-vue-next';

const props = defineProps<{
  value: string;
}>();

const isSelected = computed(() => props.value === selectValue.value);

const clickHandler = () => {
  selectValue.value = props.value;
};

const { selectValue } = inject<SELECTOR_PROVIDE>(PROVIDE_KEY) as SELECTOR_PROVIDE;
</script>
