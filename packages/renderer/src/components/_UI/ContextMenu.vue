<template>
  <div v-if="isOpened" class="w-full h-full absolute overflow-hidden z-[0]" @click="close">
    <div
      :style="menuStyle"
      class="absolute rounded select-none bg-white shadow-sm shadow-slate-400 overflow-hidden"
    >
      <div
        v-for="{ label, handler } in menuItems"
        :key="label"
        class="py-1 px-2 cursor-pointer hover:text-white hover:bg-gray-800 transition-colors"
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
  menuPosX.value = x + 3;
  menuPosY.value = y + 3;
  isOpened.value = true;
};

const menuPosY = ref(300);
const menuPosX = ref(300);

const menuStyle = computed(() => {
  return { top: `${menuPosY.value}px`, left: `${menuPosX.value}px` };
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
