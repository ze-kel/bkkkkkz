<template>
  <div :ref="(v) => setTriggerRef(v)" :class="$attrs.class" @click="open">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { PROVIDE_KEY } from '.';
import { computed, inject } from 'vue';
import type { DROPDOWN_PROVIDE } from './DropdownRoot.vue';

const { setTriggerRef, open } = inject<DROPDOWN_PROVIDE>(PROVIDE_KEY) as DROPDOWN_PROVIDE;
</script>
