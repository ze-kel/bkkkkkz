import { invoke } from '@tauri-apps/api/core';

import type { IOpenedFile } from '~/api/openedTabs';
import { useListenToEvent, type IBookFromDb } from '~/api/tauriEvents';

export const useFileState = (opened: IOpenedFile) => {
  const file = ref<IBookFromDb>();
  const error = ref<String | null>(null);

  watchEffect(async () => {
    if (opened.type === 'file') {
      const res = await invoke('c_read_file_by_path', {
        path: opened.thing,
      });

      if (typeof res === 'string') {
        error.value = res;
        return;
      }

      file.value = res as IBookFromDb;
    }
  });

  const updateHandler = (update: IBookFromDb) => {
    if (update.modified === file.value?.modified) return;
    file.value = update;

    // TODO: update editor
  };

  


  useListenToEvent('file_update', updateHandler);

  return { file, error };
};
