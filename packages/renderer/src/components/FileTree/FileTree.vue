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
      @click="select(content)"
      @click.right="startRenaming"
    >
      <div
        @click="
          () => {
            if (!isRoot) isFolded = !isFolded;
          }
        "
      >
        <svg
          v-if="Object.keys(content.content).length > 0"
          :class="['folderArrow', !isFolded && 'opened']"
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          viewBox="0 0 24 24"
        >
          <path d="M8.122 24l-4.122-4 8-8-8-8 4.122-4 11.878 12z" />
        </svg>
      </div>
      <span v-if="!isRenaming" class="name">{{ content.name }}</span>
      <input
        v-else
        ref="inputRename"
        v-model="newName"
        class="name input"
        @focusout="saveName"
        @keyup.enter="saveName"
      />
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
  (e: 'select', entity: IFolderTree): void;
}>();

const select = (entity: IFolderTree) => {
  internalInstance?.emit('select', entity);
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
    background: rgb(179, 255, 0);
  }
}

.rootFolder {
  .folderArrow {
    display: none;
  }
}

.folderArrow {
  padding: 0 5px;
  transition: transform 0.2s;
  &.opened {
    transform: rotate(90deg);
  }
}

.dropHiglight {
  border-left: 2px solid blue;
}
</style>
