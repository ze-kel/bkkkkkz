<template>
  <div class="mt-[1px]">
    <div
      class="px-2 py-0.5 border"
      :class="[nodeClasses, extraClasses]"
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
          ref="inputName"
          v-model="newName"
          :class="[nodeClasses, extraClasses, !isOpened && 'bg-transparent', 'border-gray-500']"
          @blur="saveName"
          @keyup.enter="removeFocus"
        />
      </template>
    </div>
    <div v-if="!isFolded || isCreating" :class="(foldable || isCreating) && 'pl-2'">
      <FileTreeInner
        v-for="item in content.content"
        :key="item.path"
        :content="item"
        :depth="depth + 10"
      />
      <div v-if="isCreating" class="px-2 py-0.5 border mt-[1px]" :class="[nodeClasses]">
        <input
          ref="inputName"
          v-model="newName"
          :class="nodeClasses"
          class="bg-transparent"
          @blur="saveFolder"
          @keyup.enter="removeFocus"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUpdated, ref, watchEffect } from 'vue';
import type { PropType } from 'vue';
import type { IFolderTree } from '/@main/services/files';
import { useElectron } from '/@/use/electron';
import { openMenu } from '/@/use/contextMenu';
import type { IOpened } from '/@main/services/watcher';
import type { ContextMenu } from '/@/use/contextMenu';
import { useStore } from '/@/use/store';

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

  return store.openedItem.type === 'folder' && store.openedItem.thing === props.content.path;
});

const foldable = computed(() => Object.keys(props.content.content).length > 0 && !isRoot);

const makeNewOpenedAndSelect = (recursive: boolean, newTab: boolean) => {
  if (isRoot) {
    recursive = true;
  }
  const newOpened: IOpened = {
    type: 'folder',
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
  devt.dataTransfer.setData('type', 'folder');

  devt.dataTransfer.setData('itemPath', path);

  const toUpdateIndexes = store.opened.reduce((acc: number[], opened, index) => {
    if (opened.type === 'folder' && opened.thing === path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};

const onDrop = async (e: DragEvent, targetPath: string) => {
  canDropHere.value = false;

  const type = e.dataTransfer?.getData('type');

  if (type === 'folder' || type === 'file') {
    const draggedPath = e.dataTransfer?.getData('itemPath');
    const indexes: number[] = JSON.parse(e.dataTransfer?.getData('indexesToUpdate') || '[]');

    if (!draggedPath) {
      throw 'no dragged path';
    }
    const newPath = await api.files.move(draggedPath, targetPath);

    indexes.forEach((index) => {
      const newOpened = { ...store.opened[index], thing: newPath };
      store.updateOpened(index, newOpened);
    });
  }
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
const flipOnNext = ref(false);
onUpdated(() => {
  if (flipOnNext.value) {
    isRenaming.value = false;
    isCreating.value = false;
    flipOnNext.value = false;
  }
});

const isRenaming = ref(false);
const newName = ref('');

const inputName = ref<HTMLElement | null>(null);

watchEffect(
  () => {
    inputName.value?.focus();
  },
  {
    flush: 'post',
  },
);

const removeFocus = () => {
  inputName.value?.blur();
};

const startRenaming = () => {
  isRenaming.value = true;
  newName.value = props.content.name;
};

const saveName = async () => {
  if (newName.value && newName.value !== props.content.name) {
    const oldPath = props.content.path;
    const newPath = await api.files.rename(props.content.path, newName.value);

    store.opened.forEach((item, index) => {
      if (item.type === 'folder' && item.thing === oldPath) {
        store.updateOpened(index, { ...item, thing: newPath });
      }

      if (item.type === 'file' && item.thing.includes(oldPath)) {
        store.updateOpened(index, { ...item, thing: item.thing.replace(oldPath, newPath) });
      }
    });
  }
  isRenaming.value = false;
};

///
/// Creating new folder
///
const isCreating = ref(false);

const startCreating = () => {
  isCreating.value = true;
  newName.value = '';
};

const saveFolder = () => {
  if (!newName.value) {
    isCreating.value = false;
  } else {
    api.files.createFolder(props.content.path, newName.value);
    flipOnNext.value = true;
  }
};

///
/// Right click
///
const getMenu = (): ContextMenu => {
  const base = [
    {
      label: 'New folder',
      handler: startCreating,
    },
  ];

  if (!isRoot) {
    base.push(
      {
        label: 'Rename',
        handler: startRenaming,
      },
      {
        label: 'Delete',
        handler: () => api.files.delete(props.content.path),
      },
    );
  }

  return base;
};

const openContextMenu = (e: MouseEvent) => {
  openMenu(getMenu(), e.x, e.y);
};

///
/// Styling
///
const nodeClasses = [
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

const extraClasses = computed(() => {
  const base = [];

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
