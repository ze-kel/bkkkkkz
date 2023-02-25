import type { IWatcherModule } from './watcherCore';
import FileService from '../services/files';
import { apiEventsEmitter } from '../ipc/api';
import { getRootPathSafe } from '../services/rootPath';

export const FolderUpdates: IWatcherModule = {
  async addDir() {
    const rootPath = getRootPathSafe();
    const newFiles = await FileService.getFileTree(rootPath);
    apiEventsEmitter.emit('TREE_UPDATE', newFiles);
  },
  async unlinkDir() {
    const rootPath = getRootPathSafe();
    const newFiles = await FileService.getFileTree(rootPath);
    apiEventsEmitter.emit('TREE_UPDATE', newFiles);
  },
};
