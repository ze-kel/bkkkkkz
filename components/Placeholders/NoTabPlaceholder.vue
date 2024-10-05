<template>
  <div class="flex h-full w-full flex-col items-center justify-center">
    <div>You have nothing opened.</div>
    <div class="mt-4 flex gap-4">
      <ShButton variant="outline" @click="openAllBooks">View All Books</ShButton>
      <ShButton variant="outline" @click="openNewBook">Add New Book</ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';

const store = useStore();

const openAllBooks = () => {
  if (!store.rootPath) {
    throw new Error('NoTabPlaceholder handler: no root path');
  }

  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'folder',
      thing: store.rootPath,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
      recursive: true,
    },
    { place: 'current', focus: true },
  );
};

const openNewBook = () => {
  if (!store.rootPath) {
    throw new Error('NoTabPlaceholder handler: no root path');
  }

  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'newFile',
      thing: store.rootPath,
      scrollPosition: 0,
    },
    { place: 'current', focus: true },
  );
};
</script>

<style scoped></style>
