<template>
  <div
    :style="
      !isRoot
        ? { marginLeft: depth + 'px', width: `calc(100% - ${depth}px)`, zIndex: 1000 - depth }
        : ''
    "
  >
    <div
      :class="[
        'node',
        isRoot && 'rootFolder',
        'folder',
        canDropHere && 'dropHiglight',
        openedEntity === content.path && 'opened',
      ]"
      :draggable="!isRoot"
      @dragstart="startDrag($event, content.path)"
      @drop="onDrop($event, content.path)"
      @dragenter="dragEnter"
      @dragleave="dragLeave"
      @dragover.prevent
      @click.exact="select(content, false)"
      @click.alt.exact="select(content, true)"
      @click.right.exact="startRenaming"
    >
      <div
        @click="
          () => {
            isFolded = !isFolded;
          }
        "
      >
        <font-awesome-icon
          v-if="Object.keys(content.content).length > 0"
          icon="angle-down"
          :class="['fa-regular', 'folderArrow', !isFolded && 'opened']"
        />
      </div>
      <template v-if="isRoot"> <span class="name text-L">All Books</span></template>
      <template v-else>
        <span v-if="!isRenaming" class="name text-M">{{ content.name }}</span>
        <input
          v-else
          ref="inputRename"
          v-model="newName"
          class="name input"
          @focusout="saveName"
          @keyup.enter="saveName"
      /></template>
    </div>
    <div
      v-if="!isFolded"
      :style="!isRoot ? { marginLeft: depth + 'px', zIndex: 1000 - depth - 10 } : ''"
    >
      <FileTree
        v-for="item in content.content"
        :key="item.path"
        :content="item"
        :depth="depth + 10"
        :opened-entity="openedEntity"
        @select="select"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref, watchEffect } from 'vue';
import type { PropType } from 'vue';
import type { IFolderTree } from '/@main/services/files';
import { useElectron } from '/@/use/electron';

const internalInstance = getCurrentInstance();

const electron = useElectron();

const props = defineProps({
  content: {
    type: Object as PropType<IFolderTree>,
    required: true,
  },
  depth: {
    type: Number,
    default: -10,
  },
  openedEntity: {
    type: String as PropType<IFolderTree['path'] | null>,
    default: null,
  },
});

const isRoot = props.depth < 0;
const isFolded = ref<boolean>(false);

const emit = defineEmits<{
  (e: 'select', entity: IFolderTree, recursive: boolean): void;
}>();

const select = (entity: IFolderTree, recursive: boolean) => {
  internalInstance?.emit('select', entity, recursive);
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
  console.log('dragTo', targetPath);
  const newPath = await electron.files.move(draggedPath, targetPath);
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
    if (inputRename.value) {
      //@ts-expect-error TODO: figure out proper typing
      inputRename.value.focus();
    }
  },
  {
    flush: 'post',
  },
);

const startRenaming = () => {
  console.log('onrename');
  isRenaming.value = true;
  newName.value = props.content.name;
};

const saveName = async () => {
  if (newName.value && newName.value !== props.content.name) {
    const newPath = await electron.files.rename(props.content.path, newName.value);
  }
  isRenaming.value = false;
};
</script>

<style lang="scss" scoped>
.node {
  cursor: pointer;
  border-bottom: 2px solid transparent;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 3px;
  font-size: 14px;
  overflow-x: hidden;
  border-radius: 3px;
  box-sizing: border-box;

  .name {
    width: 100%;
  }

  // Must be set for all sub elements. Otherwirse the highlighting breaks.
  .name,
  .folderArrow {
    pointer-events: none;
  }

  &.opened {
    background: var(--accent-main);
  }
}

.rootFolder {
  font-weight: bold;
}

.folderArrow {
  padding: 0 5px;
  transition: transform 0.2s;

  transform: rotate(-90deg);
  &.opened {
    transform: rotate(0deg);
  }
}

.dropHiglight {
  border-left: 2px solid blue;
}
</style>
