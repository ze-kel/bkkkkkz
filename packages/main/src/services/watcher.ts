import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs-extra';
import WebContentsProxy from '../ipc/webContents';
import FileService from './files';
import TagsStore from './tags';

import type { FSWatcher } from 'chokidar';
import { DOTFILE_REGEX } from '../helpers/utils';

export type IOpenedPath = {
  type: 'path';
  // Path
  thing: string;
  recursive: boolean;
};

export type IOpenedTag = {
  type: 'tag';
  // Tag name
  thing: string;
};

export type IOpenedFile = {
  type: 'file';
  // Path
  thing: string;
};

export type IOpenedNewFile = {
  type: 'newFile';
  // Path to be saved at
  thing: string;
};

export type IOpened = IOpenedTag | IOpenedPath | IOpenedFile | IOpenedNewFile;

type IWatcher = {
  watcher: FSWatcher | null;
  watchPath: string | null;
  opened: IOpened[];
  filesIgnore: {
    [key: string]: Date;
  };
  init: (path: string) => Promise<void>;
  destroy: () => Promise<void>;
};

const isRelevant = (loaded: IOpened, pathInQuestion: string): boolean => {
  if (loaded.type === 'file') {
    return loaded.thing === pathInQuestion;
  }

  if (loaded.type === 'path') {
    if (loaded.recursive) {
      const relative = path.relative(loaded.thing, pathInQuestion);
      return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    return path.dirname(pathInQuestion) === loaded.thing;
  }

  if (loaded.type === 'tag') {
    TagsStore.hasTag(loaded.thing, pathInQuestion);
  }

  return false;
};

const getRelevantIndexes = (opened: IOpened[], pathInQuestion: string): number[] => {
  const relevantTo: number[] = [];

  opened.forEach((openedEntry, index) => {
    if (isRelevant(openedEntry, pathInQuestion)) {
      relevantTo.push(index);
    }
  });
  return relevantTo;
};

const TheWatcher: IWatcher = {
  watcher: null,
  watchPath: null,
  opened: [],
  filesIgnore: {},
  init: async function (initPath) {
    if (this.watcher) {
      await this.destroy();
    }

    if (!fs.lstatSync(initPath).isDirectory()) {
      throw 'File path passed to watcher init';
    }
    this.watchPath = initPath;

    this.watcher = chokidar.watch(initPath, {
      ignored: (path: string) => DOTFILE_REGEX.test(path),
      persistent: true,
    });

    if (!this.watcher) {
      throw 'Watcher was not created for some reason';
    }

    const sendUpdatedTree = async () => {
      if (!this.watchPath) {
        throw 'watcher triggered but has no path data';
      }
      const newFiles = await FileService.getFileTree(this.watchPath);
      WebContentsProxy.TREE_UPDATE(newFiles);
    };

    const sendUpdatedFile = async (path: string) => {
      const newFile = await FileService.getFileContent(path);
      // TODO: MAKE TAGS UPDATE WORK
      TagsStore.processUpdatedFile(newFile, this.opened);
      const ignoreDate = this.filesIgnore[path];

      if (ignoreDate) {
        const currentTime = new Date();
        if (currentTime < ignoreDate) {
          return;
        } else {
          delete this.filesIgnore[path];
        }
      }

      const relevantIndexex = getRelevantIndexes(this.opened, path);

      if (!relevantIndexex.length) return;

      WebContentsProxy.FILE_UPDATE(path, newFile, relevantIndexex);
    };

    const sendUnlink = (unlinkedPath: string) => {
      TagsStore.processDeletedFile(unlinkedPath);

      const relevantIndexex = getRelevantIndexes(this.opened, unlinkedPath);

      if (!relevantIndexex.length) return;

      WebContentsProxy.FILE_REMOVE(unlinkedPath, relevantIndexex);
    };

    const sendAdd = async (addedPath: string) => {
      const file = await FileService.getFileContent(addedPath);
      TagsStore.processAddedFile(file);
      const relevantIndexex = getRelevantIndexes(this.opened, addedPath);

      if (!relevantIndexex.length) return;

      WebContentsProxy.FILE_ADD(addedPath, file, relevantIndexex);
    };

    this.watcher
      .on('add', sendAdd)
      .on('unlink', sendUnlink)
      .on('addDir', sendUpdatedTree)
      .on('unlinkDir', sendUpdatedTree)
      .on('change', sendUpdatedFile);
  },
  destroy: async function () {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.watchPath = null;
  },
};

export default TheWatcher;
