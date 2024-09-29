import type { IWatcherModule } from './watcherCore';
import * as path from 'path';

import { getOpenedTabs } from '../../api/openedTabs';
import type { IOpened } from '../../api/openedTabs';
import { apiEventsEmitter } from '../trpc/api.txtx';

type IWatcherFileIgnore = {
  [key: string]: Date;
};

interface IFileUpdatesModule extends IWatcherModule {
  ignored: IWatcherFileIgnore;
}

const isRelevant = (loaded: IOpened, pathInQuestion: string): boolean => {
  if (loaded.type === 'file') {
    return loaded.thing === pathInQuestion;
  }

  if (loaded.type === 'folder') {
    if (loaded.recursive) {
      const relative = path.relative(loaded.thing, pathInQuestion);
      return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    return path.dirname(pathInQuestion) === loaded.thing;
  }

  return false;
};

const getRelevantIndexes = (pathInQuestion: string): number[] => {
  const relevantTo: number[] = [];

  const tabs = getOpenedTabs().tabs;
  if (!tabs) return relevantTo;

  tabs.forEach((openedEntry, index) => {
    if (isRelevant(openedEntry, pathInQuestion)) {
      relevantTo.push(index);
    }
  });
  return relevantTo;
};

//
// Not that this module does not send updates for FILE_ADD\FILE_REMOVE when we have a tag opened. This is handled by TagUpdates.
//
export const FileUpdates: IFileUpdatesModule = {
  ignored: {},
  addFile(file) {
    const relevantIndexes = getRelevantIndexes(file.path);
    if (relevantIndexes.length) apiEventsEmitter.emit('FILE_ADD', { file, relevantIndexes });
  },
  changeFile(file) {
    const ignoreDate = this.ignored[file.path];

    if (ignoreDate) {
      const currentTime = new Date();
      if (currentTime < ignoreDate) return;
      delete this.ignored[file.path];
    }

    const relevantIndexes = getRelevantIndexes(file.path);
    if (relevantIndexes.length) apiEventsEmitter.emit('FILE_UPDATE', { file, relevantIndexes });
  },
  unlinkFile(path) {
    const relevantIndexes = getRelevantIndexes(path);
    if (relevantIndexes.length) apiEventsEmitter.emit('FILE_REMOVE', { path, relevantIndexes });
  },
};
