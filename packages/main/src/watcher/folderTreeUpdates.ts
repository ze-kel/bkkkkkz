import type { IWatcherModule } from './watcherCore';
import settings from '../services/settings';
import WebContentsProxy from '../ipc/webContents';
import FileService from '../services/files';

export const FolderUpdates: IWatcherModule = {
  async addDir() {
    const rootPath = settings.getRootPathSafe();
    const newFiles = await FileService.getFileTree(rootPath);
    WebContentsProxy.TREE_UPDATE(newFiles);
  },
  async unlinkDir() {
    const rootPath = settings.getRootPathSafe();
    const newFiles = await FileService.getFileTree(rootPath);
    WebContentsProxy.TREE_UPDATE(newFiles);
  },
};
