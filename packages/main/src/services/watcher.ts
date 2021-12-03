import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs-extra';
import WebContentsProxy from '../ipc/webContents';
import FileService from './files';

import type { FSWatcher } from 'chokidar';
import { DOTFILE_REGEX } from '../helpers/utils';

type IWatcher = {
  watcher: FSWatcher | null;
  watchPath: string | null;
  loadedPath: { path: string; recursive: boolean } | null;
  filesIgnore: {
    [key: string]: Date;
  };
  init: (path: string) => Promise<void>;
  destroy: () => Promise<void>;
};

const TheWatcher: IWatcher = {
  watcher: null,
  watchPath: null,
  loadedPath: null,
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
      const ignoreDate = this.filesIgnore[path];

      if (ignoreDate) {
        const currentTime = new Date();
        if (currentTime < ignoreDate) {
          return;
        } else {
          delete this.filesIgnore[path];
        }
      }

      const newFile = await FileService.getFileContent(path);

      WebContentsProxy.FILE_UPDATE(path, newFile);
    };

    const sendUnlink = (unlinkedPath: string) => {
      if (!this.loadedPath) return;

      if (this.loadedPath.recursive && !path.relative(this.loadedPath.path, unlinkedPath)) return;

      if (!(path.dirname(unlinkedPath) === this.loadedPath.path)) return;

      WebContentsProxy.FILE_REMOVE(unlinkedPath);
    };

    const sendAdd = async (added: string) => {
      if (!this.loadedPath) return;

      if (this.loadedPath.recursive && !path.relative(this.loadedPath.path, added)) return;

      if (!(path.dirname(added) === this.loadedPath.path)) return;

      const file = await FileService.getFileContent(added);
      WebContentsProxy.FILE_ADD(added, file);
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
