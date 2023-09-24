<template>
  <div @click.stop="close">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { PROVIDE_KEY } from './';
import { inject } from 'vue';
import type { DROPDOWN_PROVIDE } from './DropdownRoot.vue';

const { close } = inject<DROPDOWN_PROVIDE>(PROVIDE_KEY) as DROPDOWN_PROVIDE;
</script>
