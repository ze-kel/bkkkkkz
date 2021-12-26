<template>
  <div v-if="isOpened" class="w-full h-full absolute" @click.self="close">
    <div :style="menuStyle" class="absolute rounded select-none bg-white overflow-hidden">
      <div
        v-for="{ label, handler } in menuItems"
        :key="label"
        class="py-1 px-2 cursor-pointer hover:bg-gray-200 transition-colors"
        @click="handlerAndClose(handler)"
      >
        {{ label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { registerHandler } from '/@/use/contextMenu';
import type { ContextButton, ContextMenu, Handler } from '/@/use/contextMenu';

const menuItems = ref<ContextMenu>([]);
const isOpened = ref(false);
const close = () => {
  isOpened.value = false;
};

const openMenu: Handler = (items, x, y) => {
  if (!items.length) return;
  menuItems.value = items;
  mousePosX.value = x;
  mousePosY.value = y;
  isOpened.value = true;
};

const mousePosY = ref(300);
const mousePosX = ref(300);

const menuStyle = computed(() => {
  return { top: `${mousePosY.value}px`, left: `${mousePosX.value}px` };
});

const handlerAndClose = (handler: () => void) => {
  handler();
  close();
};

onMounted(() => {
  registerHandler(openMenu);
});
</script>

<style scoped></style>
