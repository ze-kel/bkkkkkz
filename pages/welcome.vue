<template>
  <!-- Empty space to drag window around -->
  <div class="dragApp col-span-2 h-10"></div>

  <div class="flex h-full flex-col items-center justify-center p-10">
    <div class="text-2xl">To begin please set working directory</div>
    <div class="text-xs">Your files & settings will be store there.</div>
    <ShButton variant="default" class="mt-4" @click="changeRootPathHandler">
      Set Working Directory
    </ShButton>
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';
import { useStore } from '~~/utils/store';

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

const changeRootPathHandler = async () => {
  const updated = await selectAndSetRootPath();
  if (updated) {
    store.fetchRootPath();
  }
};

definePageMeta({
  layout: 'empty',
});
</script>

<style scoped>
.root {
  background: var(--bg-main);
  display: flex;
  align-items: center;
  padding: 100px;
  border-radius: 5px;
}

.text {
  margin-top: 5px;
}

.button {
  width: 100%;
  border: none;
  margin-top: 10px;
  padding: 5px;
  border-radius: 4px;
  background: var(--accent-main-grad);
  cursor: pointer;
}
</style>
