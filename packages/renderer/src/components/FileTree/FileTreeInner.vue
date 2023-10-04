<template>
  <ContextMenu>
    <ContextMenuTrigger>
      <TreeCell
        v-test-class="testClasses.fileTreeItems"
        :draggable="!isRoot"
        :is-root="isRoot"
        :can-be-folded="foldable"
        :can-drop-here="dragCounter > 0"
        :name="isRoot ? 'All Books' : content.name"
        :is-folded="isFolded"
        :selected="isOpened"
        :is-renaming="isRenaming"
        @dragstart="startDrag($event, content.path)"
        @drop="onDrop($event, content.path)"
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @dragover.prevent
        @click.exact="makeNewOpenedAndSelect({ place: 'current', focus: true })"
        @click.alt.exact="makeNewOpenedAndSelect({ place: 'last' })"
        @click.middle.exact="makeNewOpenedAndSelect({ place: 'last' })"
        @fold-click="
          () => {
            isFolded = !isFolded;
          }
        "
        @save-name="saveName"
      />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem @click="startCreating"> Create folder </ContextMenuItem>
      <template v-if="!isRoot">
        <ContextMenuItem @click="startRenaming"> Rename folder </ContextMenuItem>

        <ContextMenuItem @click="deleteFolder"> Delete folder </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>

  <div v-if="!isFolded || isCreating" :class="(foldable || isCreating) && 'pl-5'">
    <FileTreeInner
      v-for="item in content.content"
      :key="item.path"
      :content="item"
      :depth="depth + 10"
    />
    <TreeCell v-if="isCreating" :name="''" :is-renaming="true" @save-name="saveNewFolder" />
  </div>
</template>

<script setup lang="ts">
import { computed, onUpdated, ref, watchEffect, nextTick } from 'vue';

import { cloneDeep as _cloneDeep } from 'lodash';
import { getDefaultViewSettings } from '/@/utils/getDefaultViewSettings';
import type { PropType } from 'vue';
import type { IFolderTree } from '/@main/services/files';
import { trpcApi } from '/@/utils/trpc';
import type { OpenNewOneParams } from '/@/use/store';
import { useStore } from '/@/use/store';
import { testClasses } from '/@/utils/testClassBinds';
import TreeCell from './TreeCell.vue';
import type { Unsubscribable } from '@trpc/server/observable';

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '/@/components/_UI/ContextMenu/';

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
const isFolded = ref(false);
const isOpened = ref(false);
// Used to prevent isOpened from going to false when renaming selected item
const renameLock = ref(false);

watchEffect(() => {
  if (renameLock.value) {
    return;
  }
  if (!store.openedItem) {
    isOpened.value = false;
    return;
  }

  isOpened.value =
    store.openedItem.type === 'folder' && store.openedItem.thing === props.content.path;
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

const dragCounter = ref(0);

const dragEnter = (e: DragEvent) => {
  console.log('e');
  e.preventDefault();
  dragCounter.value++;
  //canDropHere.value = true;
};

const dragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter.value--;
  //canDropHere.value = false;
};

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
  dragCounter.value = 0;

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

const startRenaming = () => {
  isRenaming.value = true;
};

const tempSubscription = ref<Unsubscribable>();

const resetLockFromSubscription = () => {
  renameLock.value = false;
  if (tempSubscription.value) {
    tempSubscription.value.unsubscribe();
  }
};

const saveName = async (newName: string) => {
  isRenaming.value = false;
  // Locks isOpened value
  renameLock.value = true;

  if (newName && newName !== props.content.name) {
    const oldPath = props.content.path;

    const newPath = await trpcApi.rename.mutate({
      newName: newName,
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

  // Unlocks isOpened value when our fs watcher sends updated FileTree data
  tempSubscription.value = trpcApi.treeUpdate.subscribe(undefined, {
    onComplete: resetLockFromSubscription,
  });
};

///
/// Creating new folder
///
const isCreating = ref(false);

const startCreating = () => {
  isCreating.value = true;
};

const saveNewFolder = (name: string) => {
  if (!name) {
    isCreating.value = false;
  } else {
    trpcApi.createFolder.mutate({ name, pathToFolder: props.content.path });
    flipOnNext.value = true;
  }
};

const deleteFolder = () => trpcApi.delete.mutate(props.content.path);
</script>

<style lang="postcss"></style>
