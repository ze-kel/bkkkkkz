import type { IWatcherModule } from './watcherCore';
import settings from '../services/settings';
import FileService from '../services/files';
import { apiEventsEmitter } from '../ipc/api';

export const FolderUpdates: IWatcherModule = {
  async addDir() {
    const rootPath = settings.getRootPathSafe();
    const newFiles = await FileService.getFileTree(rootPath);
    apiEventsEmitter.emit('TREE_UPDATE', newFiles);
  },
  async unlinkDir() {
    const rootPath = settings.getRootPathSafe();
    const newFiles = await FileService.getFileTree(rootPath);
    apiEventsEmitter.emit('TREE_UPDATE', newFiles);
  },
};
