<template>
  <div @click.right.stop="openMenu">
    <slot> </slot>
  </div>
</template>

<script setup lang="ts">
import { PROVIDE_KEY } from './';
import type { CONTEXT_MENU_PROVIDE } from '/@/components/_UI/ContextMenu/ContextMenu.vue';
import { inject } from 'vue';

const { openMenu } = inject<CONTEXT_MENU_PROVIDE>(PROVIDE_KEY) as CONTEXT_MENU_PROVIDE;
</script>
