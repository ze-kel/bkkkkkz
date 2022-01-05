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
  thing: string;
  recursive: boolean;
};

export type IOpenedTag = {
  type: 'tag';
  thing: string;
};

export type IOpenedFile = {
  type: 'file';
  thing: string;
};

export type IOpened = IOpenedTag | IOpenedPath | IOpenedFile;

type IWatcher = {
  watcher: FSWatcher | null;
  watchPath: string | null;
  opened: IOpened | null;
  filesIgnore: {
    [key: string]: Date;
  };
  init: (path: string) => Promise<void>;
  destroy: () => Promise<void>;
};

const isRelevant = (loaded: IOpened | null, pathInQuestion: string): boolean => {
  if (!loaded) return false;

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

const TheWatcher: IWatcher = {
  watcher: null,
  watchPath: null,
  opened: null,
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

      WebContentsProxy.FILE_UPDATE(path, newFile);
    };

    const sendUnlink = (unlinkedPath: string) => {
      TagsStore.processDeletedFile(unlinkedPath);

      if (!isRelevant(this.opened, unlinkedPath)) return;

      WebContentsProxy.FILE_REMOVE(unlinkedPath);
    };

    const sendAdd = async (addedPath: string) => {
      const file = await FileService.getFileContent(addedPath);
      TagsStore.processAddedFile(file);
      if (!isRelevant(this.opened, addedPath)) return;

      WebContentsProxy.FILE_ADD(addedPath, file);
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
