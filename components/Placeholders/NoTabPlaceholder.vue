<template>
  <div class="flex h-full w-full flex-col items-center justify-center">
    <div>You have nothing opened.</div>
    <div class="mt-4 flex gap-4">
      <ShButton @click="testErr"> Test thing </ShButton>

      <ShButton variant="outline" @click="openAllBooks">View All Books</ShButton>
      <IconsMenuBookAdder>
        <ShButton variant="outline">Add New Book</ShButton>
      </IconsMenuBookAdder>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';
import { rustErrorNotification } from '~/api/tauriEvents';

const store = useStore();

const testErr = () => {
  rustErrorNotification({
    title: 'Some error',
    info: 'bbb',
    actionInvoke: 'aas',
    actionLabel: 'Retry',
    rawError:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. \n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
  });
};

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
</script>

<style scoped></style>
