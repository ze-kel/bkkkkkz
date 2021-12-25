<template>
  <div v-if="isOpened" class="overlay" @click.self="close">
    <div :style="menuStyle" class="contextMenu">
      <div
        v-for="{ label, handler } in menuItems"
        :key="label"
        class="item header-XS"
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

<style scoped>
.overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: none;
}

.contextMenu {
  position: absolute;
  box-sizing: border-box;
  padding: 4px;
  background: var(--bg-main);
  border: 1px solid var(--bg-secondary);
  border-radius: 3px;
  user-select: none;
}

.item {
  padding: 3px;
  cursor: pointer;
  &:not(:first-child) {
    margin-top: 5px;
  }
}
</style>
