<template>
  <div>
    <div
      class="px-2 py-0.5 border"
      :class="nodeClasses"
      :draggable="!isRoot"
      @dragstart="startDrag($event, content.path)"
      @drop="onDrop($event, content.path)"
      @dragenter="dragEnter"
      @dragleave="dragLeave"
      @dragover.prevent
      @click.exact="makeNewOpenedAndSelect(false, false)"
      @click.alt.exact="makeNewOpenedAndSelect(false, true)"
      @click.right.exact="openContextMenu"
    >
      <div
        v-if="foldable"
        @click="
          () => {
            isFolded = !isFolded;
          }
        "
      >
        <svg
          icon="angle-down"
          class="pointer-events-none"
          :class="[isFolded && '-rotate-90', isOpened && 'fill-white']"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 14.5L17 9.5H7L12 14.5Z" />
        </svg>
      </div>
      <template v-if="isRoot">
        <span class="pointer-events-none font-bold">All Books</span></template
      >
      <template v-else>
        <span v-if="!isRenaming" class="pointer-events-none truncate">{{ content.name }}</span>
        <input
          v-else
          ref="inputRename"
          v-model="newName"
          :class="nodeClasses"
          @blur="saveName"
          @keyup.enter="removeFocus"
        />
      </template>
    </div>
    <div v-if="!isFolded" :class="foldable && 'pl-2'">
      <FileTreeInner
        v-for="item in content.content"
        :key="item.path"
        :content="item"
        :depth="depth + 10"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, watchEffect } from 'vue';
import type { PropType } from 'vue';
import type { IFolderTree } from '/@main/services/files';
import { useElectron } from '/@/use/electron';
import { openMenu } from '/@/use/contextMenu';
import type { IOpened } from '/@main/services/watcher';
import type { ContextMenu } from '/@/use/contextMenu';
import { useStore } from '/@/use/store';

const internalInstance = getCurrentInstance();

const api = useElectron();
const store = useStore();

const props = defineProps({
  content: {
    type: Object as PropType<IFolderTree>,
    required: true,
  },
  depth: {
    type: Number,
    default: -10,
  },
});

const isRoot = props.depth < 0;
const isFolded = ref<boolean>(false);
const isOpened = computed(() => {
  if (!store.openedItem) return false;

  return store.openedItem.type === 'path' && store.openedItem.thing === props.content.path;
});

const emit = defineEmits<{
  (e: 'select', thing: IOpened): void;
}>();

const foldable = computed(() => Object.keys(props.content.content).length > 0 && !isRoot);

const makeNewOpenedAndSelect = (recursive: boolean, newTab: boolean) => {
  const newOpened: IOpened = {
    type: 'path',
    thing: props.content.path,
    recursive,
  };

  if (newTab || store.activeOpenedIndex === null) {
    store.addOpened(newOpened);
  } else {
    store.updateOpened(store.activeOpenedIndex, newOpened);
  }
};

///
/// Drag and drop
///
const canDropHere = ref<boolean>(false);

const startDrag = (devt: DragEvent, path: string) => {
  if (devt.dataTransfer === null) {
    return;
  }
  devt.dataTransfer.dropEffect = 'move';
  devt.dataTransfer.effectAllowed = 'move';
  devt.dataTransfer.setData('itemPath', path);
};

const onDrop = async (e: DragEvent, targetPath: string) => {
  const draggedPath = e.dataTransfer?.getData('itemPath');
  canDropHere.value = false;
  if (!draggedPath) {
    throw 'no dragged path';
  }
  const newPath = await api.files.move(draggedPath, targetPath);
};

const dragEnter = (e: DragEvent) => {
  e.preventDefault();
  canDropHere.value = true;
};

const dragLeave = (e: DragEvent) => {
  e.preventDefault();
  canDropHere.value = false;
};

///
/// Renaming
///
const isRenaming = ref<boolean>(false);
const newName = ref<string>('');

const inputRename = ref(null);

watchEffect(
  () => {
    //@ts-expect-error TODO: figure out proper typing
    inputRename.value?.focus();
  },
  {
    flush: 'post',
  },
);

const removeFocus = () => {
  //@ts-expect-error TODO: figure out proper typing
  inputRename.value?.blur();
};

const startRenaming = () => {
  isRenaming.value = true;
  newName.value = props.content.name;
};

const saveName = async () => {
  if (newName.value && newName.value !== props.content.name) {
    const newPath = await api.files.rename(props.content.path, newName.value);
  }
  isRenaming.value = false;
};

///
/// Right click
///
const menu: ContextMenu = [
  {
    label: 'Rename',
    handler: startRenaming,
  },
  {
    label: 'Delete',
    handler: () => api.files.delete(props.content.path),
  },
];

const openContextMenu = (e: MouseEvent) => {
  openMenu(menu, e.x, e.y);
};

///
/// Styling
///
const nodeClasses = computed(() => {
  const base = [
    'text-m',
    'whitespace-nowrap',
    'overflow-hidden',
    'rounded',
    'cursor-pointer',
    'font-medium',
    'flex',
    'items-center',
    'outline-0',
    'transition-colors',
  ];
  if (isOpened.value) {
    base.push('bg-indigo-600', 'text-white', 'hover:bg-indigo-800');
  } else {
    base.push('hover:text-gray-600');
  }

  if (canDropHere.value) {
    base.push('border-indigo-700', 'my-0');
  } else {
    base.push('border-transparent');
  }

  return base;
});
</script>

<style lang="postcss"></style>
