<template>
  <div
    v-if="isOpened"
    :ref="(v) => setFloatingRef(v)"
    :class="
      classMerge(
        'z-50',
        !unstyled &&
          'overflow-hidden rounded-md border border-neutral-100 bg-neutral-50 p-1 shadow-md dark:border-neutral-900 dark:bg-neutral-950',
        $attrs.class as string,
      )
    "
    :style="floatingStyles"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { PROVIDE_KEY } from './';
import { computed, inject } from 'vue';
import type { DROPDOWN_PROVIDE } from './DropdownRoot.vue';

import classMerge from '/@/utils/classMerge';

const props = defineProps({
  unstyled: {
    type: Boolean,
    default: false,
  },
});

const { setFloatingRef, isOpened, floatingStyles, close } = inject<DROPDOWN_PROVIDE>(
  PROVIDE_KEY,
) as DROPDOWN_PROVIDE;
</script>
