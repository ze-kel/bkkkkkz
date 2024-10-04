import { apiEventsEmitter } from '~/api/events';
import type { IWatcherModule } from './watcherCore';

import * as FileService from '~/api/files';

export const FolderUpdates: IWatcherModule = {
  async addDir() {
    const rootPath = rootPathFromStore();
    const newFiles = await FileService.getFileTree(rootPath);
    apiEventsEmitter.emit('TREE_UPDATE', newFiles);
  },
  async unlinkDir() {
    const rootPath = rootPathFromStore();
    const newFiles = await FileService.getFileTree(rootPath);
    apiEventsEmitter.emit('TREE_UPDATE', newFiles);
  },
};
