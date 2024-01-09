<template>
  <!-- Empty space to drag window around -->
  <div class="dragApp col-span-2 h-10"></div>

  <div class="flex h-full flex-col items-center justify-center p-10">
    <div class="text-2xl">To begin please set working directory</div>
    <div class="text-xs">Your files & settings will be store there.</div>
    <BasicButton variant="default" class="mt-4" @click="changeRootPathHandler">
      Set Working Directory
    </BasicButton>
  </div>
</template>

<script lang="ts" setup>
import BasicButton from '/@/components/_UI/BasicButton/BasicButton.vue';
import { useStore } from '/@/use/store';
import { trpcApi } from '/@/utils/trpc';

const store = useStore();

const changeRootPathHandler = async () => {
  const updated = await trpcApi.setRootPath.mutate();
  if (updated) {
    store.fetchRootPath();
  }
};
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
