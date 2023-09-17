<template>
  <div
    v-if="isOpened"
    :ref="
      (el) => {
        setFloatingRef(el);
      }
    "
    class="z-50 min-w-5 overflow-hidden rounded-md border border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950 p-1 shadow-md"
    :style="floatingStyles"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { PROVIDE_KEY } from './';
import type { CONTEXT_MENU_PROVIDE } from '/@/components/_UI/ContextMenu/ContextMenu.vue';
import { inject } from 'vue';

const { isOpened, floatingStyles, setFloatingRef } = inject<CONTEXT_MENU_PROVIDE>(
  PROVIDE_KEY,
) as CONTEXT_MENU_PROVIDE;
</script>
