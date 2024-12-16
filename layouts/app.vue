<template>
  <Sidebar />
  <div class="h-full w-full">
    <div
      data-tauri-drag-region
      class="col-span-2 box-border h-10 w-full bg-neutral-200 dark:bg-neutral-900"
    >
      <TabsSelector />
    </div>

    <div class="h-[calc(100vh_-_2.5rem)] max-h-full w-full items-start">
      <!-- Empty space to drag window around -->

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSidebar } from '~/components/_shadcn/sidebar';
import Sidebar from '~/components/Sidebar/Sidebar.vue';
import TabsSelector from '~/components/ViewCore/TabsSelector.vue';

const s = useSidebar();

const store = useStore();

// Root Path loading Logic
watch(
  () => store.rootPath,
  async () => {
    if (typeof store.rootPath !== 'string') {
      await navigateTo('/welcome');
      return;
    }
    await store.fetchSetting();
    await store.fetchOpened();
  },
  { immediate: true },
);
</script>

<style>
.customCols {
  grid-template-columns: min-content min-content 1fr;
  grid-template-rows: min-content 100%;
}
</style>
