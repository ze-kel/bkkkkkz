import { debounce as _debounce, throttle } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';

import type { IOpenedPath, IOpenedTag } from '~/api/openedTabs';

import { rustErrorNotification, useListenToEvent, type IBookFromDb } from '~/api/tauriEvents';
import { useThrottledEvents } from '~/utils/useTrottledEvents';
import path from 'path-browserify';
import { c_get_files_path, type BookListGetResult } from '~/api/tauriActions';

export const useFilesList = (
  opened: IOpenedPath | IOpenedTag,
  onLoaded?: () => void | Promise<void>,
) => {
  const data = ref<BookListGetResult | null>(null);

  const loading = ref(true);

  const loadContent = async () => {
    loading.value = true;
    if (opened.type === 'folder') {
      const res = await c_get_files_path(opened.thing);
      if ('isError' in res) {
        rustErrorNotification(res, {});
        return;
      }
      data.value = res;
    }

    nextTick(() => {
      loading.value = false;
      if (onLoaded) {
        onLoaded();
      }
    });
  };

  onMounted(() => {
    loadContent();
  });

  //
  // Update event handling
  //
  const updateOrAddToFiles = (book: IBookFromDb) => {
    if (!data.value) return;
    const books = data.value.books;
    // Do not assume that add event will be called once
    // I encountered watcher on mac emitting duplicate events when copying files
    const index = books.findIndex((v) => v.path === book.path);
    if (index >= 0) {
      books[index] = book;
    } else {
      books.push(book);
    }
    triggerRef(data);
  };

  const removeFromFiles = (path: string) => {
    if (!data.value) return;
    const books = data.value.books;
    const index = books.findIndex((v) => v.path === path);

    if (index >= 0) {
      books.splice(index, 1);
      triggerRef(data);
    }
  };

  const processEvent = (e: FileListEvent) => {
    switch (e.event) {
      case 'add':
        updateOrAddToFiles(e.book);
        break;
      case 'remove':
        removeFromFiles(e.path);
        break;
      case 'update':
        updateOrAddToFiles(e.book);
        break;
    }
  };

  const processEvents = (e: FileListEvent[]) => {
    e.forEach(processEvent);
  };

  const { onEvent, processQueue } = useThrottledEvents(processEvents, loadContent, 1000, 15);

  useListenToEvent('file_add', (book) => onEvent({ event: 'add', book }));
  useListenToEvent('file_update', (book) => onEvent({ event: 'update', book }));
  useListenToEvent('file_remove', (path) => onEvent({ event: 'remove', path }));

  // For folder events we just reload everything because it can modify a lot of sub-files\sub-dirs
  useListenToEvent('folder_add', (v) => {
    if (opened.type !== 'folder' || isChangedFolderRelevant(opened.thing, v)) processQueue(true);
  });
  useListenToEvent('folder_remove', (v) => {
    if (opened.type !== 'folder' || isChangedFolderRelevant(opened.thing, v)) processQueue(true);
  });

  return { data, loading };
};

const isChangedFolderRelevant = (myPath: string, eventPath: string) => {
  const relative = path.relative(myPath, eventPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
};

type FileListEvent =
  | {
      event: 'add';
      book: IBookFromDb;
    }
  | {
      event: 'update';
      book: IBookFromDb;
    }
  | {
      event: 'remove';
      path: string;
    };
