import * as chokidar from 'chokidar';
import { extname } from 'path';
import * as fs from 'fs-extra';
import FileService from '../services/files';
import { DOTFILE_REGEX, DOTDIR_REGEX } from '../helpers/utils';

import { FileUpdates } from './fileUpdates';
import { FolderUpdates } from './folderTreeUpdates';
import { TagUpdates } from './tagUpdates';

import type { FSWatcher } from 'chokidar';
import type { ISavedFile } from '../services/files';
import { getRootPath } from '../services/rootPath';

export type IWatcherFunction = (path: string) => void | Promise<void>;
export type IWatcherFunctionFFile = (file: ISavedFile) => void | Promise<void>;
export type IWatcherFunctionFFiles = (files: ISavedFile[]) => void | Promise<void>;

export interface IWatcherModule {
  initialize?: () => void;
  initialFiles?: IWatcherFunctionFFiles;
  addFile?: IWatcherFunctionFFile;
  unlinkFile?: IWatcherFunction;
  changeFile?: IWatcherFunctionFFile;
  addDir?: IWatcherFunction;
  unlinkDir?: IWatcherFunction;
  [propName: string]: unknown;
}

type IWatcher = {
  watcher: FSWatcher | null;
  modules: IWatcherModule[];
  init: () => Promise<boolean>;
  destroy: () => Promise<void>;
};

const TheWatcher: IWatcher = {
  watcher: null,
  modules: [FileUpdates, FolderUpdates, TagUpdates],
  init: async function () {
    if (this.watcher) {
      await this.destroy();
    }

    const rootPath = getRootPath();
    if (!rootPath) return false;

    if (!fs.lstatSync(rootPath).isDirectory()) {
      throw 'File path passed to watcher init';
    }

    this.watcher = chokidar.watch(rootPath, {
      ignored: (pathStr: string) => {
        return DOTFILE_REGEX.test(pathStr) || DOTDIR_REGEX.test(pathStr);
      },
      persistent: true,
    });

    if (!this.watcher) {
      throw 'Watcher was not created for some reason';
    }

    this.modules.forEach(async (module) => {
      if (module.initialize) module.initialize();
    });

    const initialFiles = await FileService.loadFilesFromFolder(rootPath, true);
    this.modules.forEach(async (module) => {
      if (module.initialFiles) await module.initialFiles(Object.values(initialFiles));
    });

    const add = async (path: string) => {
      if (extname(path) !== '.md') return;
      const file = await FileService.getFileContent(path);
      this.modules.forEach(async (module) => {
        if (module.addFile) await module.addFile(file);
      });
    };

    const unlink = async (path: string) => {
      if (extname(path) !== '.md') return;
      this.modules.forEach(async (module) => {
        if (module.unlinkFile) await module.unlinkFile(path);
      });
    };

    const change = async (path: string) => {
      console.log('CHANGE ', path);
      if (extname(path) !== '.md') return;
      const file = await FileService.getFileContent(path);
      this.modules.forEach(async (module) => {
        if (module.changeFile) await module.changeFile(file);
      });
    };

    const addDir = async (path: string) => {
      this.modules.forEach(async (module) => {
        if (module.addDir) await module.addDir(path);
      });
    };

    const unlinkDir = async (path: string) => {
      this.modules.forEach(async (module) => {
        if (module.unlinkDir) await module.unlinkDir(path);
      });
    };

    this.watcher
      .on('add', add)
      .on('unlink', unlink)
      .on('addDir', addDir)
      .on('unlinkDir', unlinkDir)
      .on('change', change);

    return true;
  },
  destroy: async function () {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  },
};

export default TheWatcher;
