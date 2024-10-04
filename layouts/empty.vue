<template>
  <slot />
</template>

<script lang="ts">
const store = useStore();

watch(
  () => store.rootPath,
  async (v) => {
    if (!v) {
      return;
    }
    await navigateTo('/');
  },
  { immediate: true },
);
</script>
