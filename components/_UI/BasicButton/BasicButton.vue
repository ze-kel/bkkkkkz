<script setup lang="ts">
import cls from '~/utils/cls';
import { buttonVariants } from '~/components/_UI/BasicButton/BasicButtonStyle';

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
  <component :is="as" :class="cls(buttonVariants({ variant, size }), $attrs.class as string)">
    <slot />
  </component>
</template>
