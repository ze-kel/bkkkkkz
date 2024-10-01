import type { IWatcherModule } from './watcherCore';
import * as path from '@tauri-apps/api/path';

import type { IOpened } from '../../api/openedTabs';
import { apiEventsEmitter } from '~/api/events';

type IWatcherFileIgnore = {
  [key: string]: Date;
};

interface IFileUpdatesModule extends IWatcherModule {
  ignored: IWatcherFileIgnore;
}

const isRelevant = async (loaded: IOpened, pathInQuestion: string) => {
  if (loaded.type === 'file') {
    return loaded.thing === pathInQuestion;
  }

  if (loaded.type === 'folder') {
    if (loaded.recursive) {
      const relative = await path.resolve(loaded.thing, pathInQuestion);
      return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    return (await path.dirname(pathInQuestion)) === loaded.thing;
  }

  return false;
};

const getRelevantIndexes = async (pathInQuestion: string) => {
  const relevantTo: number[] = [];

  const store = useStore();

  const tabs = store.openedTabs;

  if (!tabs) return relevantTo;

  await Promise.all(
    tabs.map(async (openedTab, index) => {
      if (await isRelevant(openedTab, pathInQuestion)) {
        relevantTo.push(index);
      }
    }),
  );
  return relevantTo;
};

//
// Note that this module does not send updates for FILE_ADD\FILE_REMOVE when we have a tag opened. This is handled by TagUpdates.
//
export const FileUpdates: IFileUpdatesModule = {
  ignored: {},
  async addFile(file) {
    const relevantIndexes = await getRelevantIndexes(file.path);
    if (relevantIndexes.length) apiEventsEmitter.emit('FILE_ADD', { file, relevantIndexes });
  },
  async changeFile(file) {
    console.log('change file');
    const ignoreDate = this.ignored[file.path];

    if (ignoreDate) {
      const currentTime = new Date();
      if (currentTime < ignoreDate) return;
      delete this.ignored[file.path];
    }

    const relevantIndexes = await getRelevantIndexes(file.path);
    console.log('emitting fine update', relevantIndexes);
    if (relevantIndexes.length) apiEventsEmitter.emit('FILE_UPDATE', { file, relevantIndexes });
  },
  async unlinkFile(path) {
    const relevantIndexes = await getRelevantIndexes(path);
    if (relevantIndexes.length) apiEventsEmitter.emit('FILE_REMOVE', { path, relevantIndexes });
  },
};
