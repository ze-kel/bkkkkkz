<template>
  <MenuRoot
    v-if="isOpened"
    :ref="
      (el) => {
        setFloatingRef(el as HTMLDivElement);
      }
    "
    :style="floatingStyles"
  >
    <slot />
  </MenuRoot>
</template>

<script lang="ts" setup>
import { PROVIDE_KEY } from '.';
import type { CONTEXT_MENU_PROVIDE } from '~/components/_UI/ContextMenu/ContextMenu.vue';
import { inject } from 'vue';
import { MenuRoot } from '~/components/_UI/GenericMenu';

const { isOpened, floatingStyles, setFloatingRef } = inject<CONTEXT_MENU_PROVIDE>(
  PROVIDE_KEY,
) as CONTEXT_MENU_PROVIDE;
</script>
