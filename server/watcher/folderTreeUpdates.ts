import type { IWatcherModule } from './watcherCore';
import FileService from '../../api/files';
import { apiEventsEmitter } from '../trpc/api.txtx';
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
