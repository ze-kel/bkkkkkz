import * as path from 'path';
import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';

import { makeBookFile, makeEncodedBook } from './books';

import type { FSWatcher } from 'chokidar';
import type { BrowserWindow } from 'electron';
import type { IBookData } from './books';

export type IFolderTree = {
  type: 'folder';
  name: string;
  path: string;
  content: {
    [key: string]: IFolderTree;
  };
};

export interface ILoadedFile extends IBookData {
  name: string;
  path: string;
  content: string;
}

export type ILoadedFiles = {
  [key: string]: ILoadedFile;
};

type IWatcherVerifyPath = (path: string) => void;
type IWatcherSendUpdated = () => Promise<void>;

type IWatcher = {
  watcher: FSWatcher | null;
  watchPath: string | null;
  loadedPath: { path: string; recursive: boolean } | null;
  filesIgnore: {
    [key: string]: Date;
  };
  init: (win: BrowserWindow, path: string) => Promise<void>;
  destroy: () => Promise<void>;
  verifyPath: IWatcherVerifyPath;
  sendUpdated?: IWatcherSendUpdated;
};

const theWatcher: IWatcher = {
  watcher: null,
  watchPath: null,
  loadedPath: null,
  filesIgnore: {},
  init: async function (win, initPath) {
    if (this.watcher) {
      await this.destroy();
    }

    this.verifyPath(initPath);

    this.watchPath = initPath;

    this.watcher = chokidar.watch(initPath, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
    });

    if (!this.watcher) {
      throw 'Watcher was not created';
    }

    const sendUpdatedFolder = async () => {
      if (!this.watchPath) {
        throw 'watcher triggered but has no path data';
      }
      const newFiles = await getFileTree(this.watchPath);

      win.webContents.send('FOLDER_TREE', newFiles);
    };

    const sendUpdatedFile = async (path: string) => {
      const ignore = this.filesIgnore[path];

      if (ignore) {
        const currentTime = new Date();
        if (currentTime < ignore) {
          return;
        } else {
          delete this.filesIgnore[path];
        }
      }

      const newFile = await getFileContent(path);

      win.webContents.send('FILE_UPDATE', path, newFile);
    };

    const sendUnlink = (unlinkedPath: string) => {
      if (!this.loadedPath) return;

      if (this.loadedPath.recursive) {
        if (path.relative(this.loadedPath.path, unlinkedPath)) {
          win.webContents.send('FILE_REMOVE', unlinkedPath);
        }
      } else {
        if (path.dirname(unlinkedPath) === this.loadedPath.path) {
          win.webContents.send('FILE_REMOVE', unlinkedPath);
        }
      }
    };

    const sendAdd = async (added: string) => {
      if (!this.loadedPath) return;
      if (this.loadedPath.recursive) {
        if (path.relative(this.loadedPath.path, added)) {
          const file = await getFileContent(added);
          win.webContents.send('FILE_ADD', file);
        }
      } else {
        if (path.dirname(added) === this.loadedPath.path) {
          const file = await getFileContent(added);
          win.webContents.send('FILE_ADD', file);
        }
      }
    };

    this.watcher
      .on('add', sendAdd)
      .on('unlink', sendUnlink)
      .on('addDir', sendUpdatedFolder)
      .on('unlinkDir', sendUpdatedFolder)
      .on('change', sendUpdatedFile);
  },
  destroy: async function () {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.watchPath = null;
  },
  verifyPath: function (path) {
    if (fs.lstatSync(path).isDirectory()) {
      return;
    } else {
      throw 'File path passed to watcher init';
    }
  },
};

const getFileTree = (basePath: string): IFolderTree => {
  fs.ensureDirSync(basePath);

  const files = fs.readdirSync(basePath);

  const output: IFolderTree = {
    type: 'folder',
    name: path.basename(basePath),
    path: basePath,
    content: {},
  };

  files.forEach((file: string) => {
    if (fs.statSync(path.join(basePath, file)).isDirectory()) {
      output.content[file] = getFileTree(path.join(basePath, file));
    }
  });

  return output;
};

const getFileContent = async (filePath: string): Promise<ILoadedFile> => {
  if (!fs.existsSync(filePath)) {
    throw new Error('No such file');
  }

  return makeBookFile(filePath, path.basename(filePath));
};

const loadFilesFromFolder = async (basePath: string, recursive: boolean): Promise<ILoadedFiles> => {
  fs.ensureDirSync(basePath);
  const files = fs.readdirSync(basePath);

  const result: ILoadedFiles = {};

  await Promise.all(
    files.map(async (file: string) => {
      const fullPath = path.join(basePath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (recursive) {
          const moreFiles = await loadFilesFromFolder(fullPath, recursive);
          Object.entries(moreFiles).forEach(async ([path, content]) => {
            result[path] = content;
          });
        }
        return;
      } else {
        const fileContent = await getFileContent(fullPath);
        result[fullPath] = fileContent;
      }
    }),
  );

  return result;
};

const saveFileContent = async (file: ILoadedFile): Promise<void> => {
  const encoded = makeEncodedBook(file);
  await fs.writeFile(file.path, encoded);
};

const move = async (srcPath: string, targetPath: string): Promise<void> => {
  if (targetPath === srcPath) {
    return;
  }
  await fs.move(srcPath, targetPath);
};

export default {
  theWatcher,
  getFileTree,
  getFileContent,
  loadFilesFromFolder,
  saveFileContent,
  move,
};
