<script setup lang="ts">
import { cva } from 'class-variance-authority';
import classMerge from '/@/utils/classMerge';
import { buttonVariants } from '/@/components/_UI/BasicButton/BasicButtonStyle';

interface Props {
  variant?: NonNullable<Parameters<typeof buttonVariants>[0]>['variant'];
  size?: NonNullable<Parameters<typeof buttonVariants>[0]>['size'];
  as?: string;
}

withDefaults(defineProps<Props>(), {
  as: 'button',
});
</script>

<template>
  <component
    :is="as"
    :class="classMerge(buttonVariants({ variant, size }), $attrs.class as string)"
  >
    <slot />
  </component>
</template>
