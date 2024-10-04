<template>
  <div class="flex h-full w-full flex-col items-center justify-center">
    <div class="text-center">You dont have any books {{ isRootOpened ? 'yet' : 'here' }}.</div>
    <div class="mt-4 flex gap-4">
      <BasicButton v-if="isRootOpened" variant="outline" @click="addDemoBooks"
        >Add Demo Books</BasicButton
      >
      <BasicButton v-else variant="outline" @click="openAllBooks">View All Books</BasicButton>

      <BasicButton variant="outline" @click="openNewBook">Add New Book</BasicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';
import { useStore } from '~~/utils/store';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';
import { saveNewFiles } from '~/api/files';

const store = useStore();

const isRootOpened = store.openedItem?.thing === store.rootPath;

const addDemoBooks = async () => {
  if (!store.rootPath) {
    throw new Error('EmptyAllBooksPlaceholder handler: no root path');
  }

  await saveNewFiles({
    basePath: store.rootPath,
    files: [
      {
        title: 'Crime and Punishment',
        author: 'Fyodor Dostoevsky',
        year: 1866,
        unsaved: true,
        isbn13: 9780140449136,
        myRating: 5,
        read: [
          {
            started: '2019-06-01',
            finished: '2019-08-20',
          },
          {
            started: '2022-01-10',
            finished: '2022-01-30',
          },
        ],
        tags: ['classic', 'russian', 'reccomended'],
        content:
          "Crime and Punishment is a novel by the Russian author Fyodor Dostoevsky. It was first published in the literary journal The Russian Messenger in twelve monthly installments during 1866. \n\n\n\nIt was later published in a single volume. It is the second of Dostoevsky's full-length novels following his return from ten years of exile in Siberia. Crime and Punishment is considered the first great novel of his mature period of writing and is often cited as one of the greatest works of world literature.",
      },
      {
        title: 'American Psycho',
        author: 'Bret Easton Ellis',
        year: 1991,
        unsaved: true,
        isbn13: 9780679735779,
        myRating: 4,
        read: [
          {
            started: '2023-06-16',
            finished: '2023-07-01',
          },
        ],
        tags: ['sigmagridnset', 'american'],
        content: 'Literally me btw.',
      },
      {
        title: 'Twilight',
        author: 'Stephenie Meyer',
        year: 2005,
        unsaved: true,
        isbn13: 9780316160179,
        read: [
          {
            started: '2023-06-16',
          },
        ],
        tags: ['american', 'relatioshipadvice'],
        content: '',
      },
    ],
  });
};

const openNewBook = () => {
  if (!store.rootPath) {
    throw new Error('EmptyAllBooksPlaceholder handler: no root path');
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
