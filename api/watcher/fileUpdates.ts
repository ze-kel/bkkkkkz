import { apiEventsEmitter } from '~/api/events';
import type { IWatcherModule } from './watcherCore';

type IWatcherFileIgnore = {
  [key: string]: Date;
};

interface IFileUpdatesModule extends IWatcherModule {
  ignored: IWatcherFileIgnore;
}

export const FileUpdates: IFileUpdatesModule = {
  ignored: {},
  async addFile(file, path) {
    apiEventsEmitter.emit('FILE_ADD', { file, path });
  },
  async changeFile(file, path) {
    const ignoreDate = this.ignored[file.path];

    if (ignoreDate) {
      const currentTime = new Date();
      if (currentTime < ignoreDate) return;
      delete this.ignored[file.path];
    }

    apiEventsEmitter.emit('FILE_UPDATE', { file, path });
  },
  async unlinkFile(path) {
    apiEventsEmitter.emit('FILE_REMOVE', { path });
  },
};
