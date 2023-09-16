<template>
  <div
    ref="treeEl"
    v-test-class="['T-file-tree-item', isOpened && 'T-opened-folder']"
    :class="nodeClasses({ canDropHere, opened: isOpened })"
    :draggable="!isRoot"
    @dragstart="startDrag($event, content.path)"
    @drop="onDrop($event, content.path)"
    @dragenter="dragEnter"
    @dragleave="dragLeave"
    @dragover.prevent
    @click.exact="makeNewOpenedAndSelect({ place: 'current', focus: true })"
    @click.alt.exact="makeNewOpenedAndSelect({ place: 'last' })"
    @click.middle.exact="makeNewOpenedAndSelect({ place: 'last' })"
    @click.right.exact="openContextMenu"
  >
    <div
      v-if="foldable"
      class="cursor-pointer"
      @click="
        () => {
          isFolded = !isFolded;
        }
      "
    >
      <ChevronDown
        :class="['w-3 h-3 mr-1', isFolded && '-rotate-90']"
        class="cursor-poiner pointer-events-none"
      />
    </div>
    <template v-if="isRoot">
      <span v-test-class="'T-label'" class="pointer-events-none"> All Books </span>
    </template>
    <template v-else>
      <span v-if="!isRenaming" v-test-class="'T-label'" class="pointer-events-none truncate">
        {{ content.name }}
      </span>
      <input
        v-else
        ref="inputName"
        v-model="newName"
        :class="['w-full bg-transparent outline-none', 'border-neutral-500']"
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
    <div
      v-if="isCreating"
      class="mt-[1px] px-2 py-0.5"
      :class="nodeClasses({ opened: true, canDropHere: false })"
    >
      <input
        ref="inputName"
        v-model="newName"
        class="w-full border-none bg-transparent outline-none"
        @blur="saveFolder"
        @keyup.enter="removeFocus"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUpdated, ref, watchEffect, nextTick } from 'vue';
import { openMenu } from '/@/use/contextMenu';
import { cloneDeep as _cloneDeep } from 'lodash';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';
import { ChevronDown } from 'lucide-vue-next';
import type { PropType } from 'vue';
import type { IFolderTree } from '/@main/services/files';
import type { ContextMenu } from '/@/use/contextMenu';
import { trpcApi } from '/@/utils/trpc';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '/@/use/store';
import { cva } from 'class-variance-authority';

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

const makeNewOpenedAndSelect = (params: OpenNewOneParams) => {
  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'folder',
      thing: props.content.path,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
      recursive: isRoot,
    },
    params,
  );
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

  if (!store.openedTabs) {
    return;
  }

  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
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
    const newPath = await trpcApi.move.mutate({
      moveItemPath: draggedPath,
      toFolderPath: targetPath,
    });

    indexes.forEach((index) => {
      if (!store.openedTabs) return;
      const before = store.openedTabs[index];
      if (before.type === 'file' || before.type === 'folder') {
        store.openNewOne({ ...before, thing: newPath }, { place: 'replace', index });
      }
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

    const newPath = await trpcApi.rename.mutate({
      newName: newName.value,
      srcPath: props.content.path,
    });

    if (!store.openedTabs) return;

    store.openedTabs.forEach((item, index) => {
      if (item.type === 'folder' && item.thing === oldPath) {
        store.openNewOne({ ...item, thing: newPath }, { place: 'replace', index });
      }

      if (item.type === 'file' && item.thing.includes(oldPath)) {
        store.openNewOne(
          { ...item, thing: item.thing.replace(oldPath, newPath) },
          { place: 'replace', index },
        );
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
    trpcApi.createFolder.mutate({ name: newName.value, pathToFolder: props.content.path });
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
        handler: () => trpcApi.delete.mutate(props.content.path),
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
const nodeClasses = cva(
  [
    `p-1 mt-0.5 flex items-center text-m whitespace-nowrap overflow-hidden
    rounded text-sm font-medium outline-0 transition-colors`,
  ],
  {
    variants: {
      opened: {
        true: 'text-neutral-800 dark:text-neutral-50',
        false: 'cursor-pointer text-neutral-400 dark:text-neutral-600',
      },
      canDropHere: {
        true: '',
      },
    },
    compoundVariants: [],
  },
);
</script>

<style lang="postcss"></style>
