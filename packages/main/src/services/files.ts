import * as path from 'path';
import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';

import { makeBookFile, makeEncodedBook } from './books';
import Settings from './settings';

import type { FSWatcher } from 'chokidar';
import type { IBookData } from './books';
import type { BrowserWindow } from 'electron';

const FILENAME_REGEX = /[\\/:"*?<>|]+/g;
const DOTFILE_REGEX = /(?:^|[\\/])(\.(?!\.)[^\\/]+)$/;

export type IFolderTree = {
  type: 'folder';
  name: string;
  path: string;
  content: {
    [key: string]: IFolderTree;
  };
};

export type IUnsavedFile = IBookData;

export interface ISavedFile extends IUnsavedFile {
  name: string;
  path: string;
  content: string;
}

export type IFile = ISavedFile;

export type IFiles = {
  [key: string]: IFile;
};

type IWatcher = {
  watcher: FSWatcher | null;
  watchPath: string | null;
  loadedPath: { path: string; recursive: boolean } | null;
  filesIgnore: {
    [key: string]: Date;
  };
  init: (win: BrowserWindow, path: string) => Promise<void>;
  destroy: () => Promise<void>;
};

const theWatcher: IWatcher = {
  watcher: null,
  watchPath: null,
  loadedPath: null,
  filesIgnore: {},
  init: async function (mainWindow, initPath) {
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
      if (!mainWindow) {
        return;
      }
      const newFiles = await getFileTree(this.watchPath);
      mainWindow.webContents.send('FOLDER_TREE', newFiles);
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

      const newFile = await getFileContent(path);

      if (!mainWindow) {
        return;
      }
      mainWindow.webContents.send('FILE_UPDATE', path, newFile);
    };

    const sendUnlink = (unlinkedPath: string) => {
      if (!mainWindow) {
        return;
      }

      if (!this.loadedPath) return;

      if (this.loadedPath.recursive && !path.relative(this.loadedPath.path, unlinkedPath)) return;

      if (!(path.dirname(unlinkedPath) === this.loadedPath.path)) return;

      mainWindow.webContents.send('FILE_REMOVE', unlinkedPath);
    };

    const sendAdd = async (added: string) => {
      if (!mainWindow) {
        return;
      }

      if (!this.loadedPath) return;

      if (this.loadedPath.recursive && !path.relative(this.loadedPath.path, added)) return;

      if (!(path.dirname(added) === this.loadedPath.path)) return;

      const file = await getFileContent(added);
      mainWindow.webContents.send('FILE_ADD', added, file);
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
    if (DOTFILE_REGEX.test(file)) return;
    if (fs.statSync(path.join(basePath, file)).isDirectory()) {
      output.content[file] = getFileTree(path.join(basePath, file));
    }
  });

  return output;
};

const getFileContent = async (filePath: string): Promise<ISavedFile> => {
  if (!fs.existsSync(filePath)) {
    throw new Error('No such file');
  }

  return makeBookFile(filePath, path.basename(filePath));
};

const loadFilesFromFolder = async (basePath: string, recursive: boolean): Promise<IFiles> => {
  fs.ensureDirSync(basePath);
  const files = fs.readdirSync(basePath);

  const result: IFiles = {};

  await Promise.all(
    files.map(async (file: string) => {
      const fullPath = path.join(basePath, file);
      if (DOTFILE_REGEX.test(file)) return;

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

const saveFileContent = async (file: ISavedFile): Promise<void> => {
  const encoded = makeEncodedBook(file);
  await fs.writeFile(file.path, encoded);
};

const saveNewFile = async (basePath: string, file: IUnsavedFile): Promise<void> => {
  const baseName = `${file.author ? file.author : 'unknown'} — ${
    file.title ? file.title : 'unknown'
  }`.replace(FILENAME_REGEX, '');
  let newName = baseName;
  let uniquenessNumber = 2;

  while (fs.existsSync(path.join(basePath, newName))) {
    newName = `${baseName} (${uniquenessNumber})`;
    uniquenessNumber++;
  }

  const fileToSave: ISavedFile = {
    ...file,
    name: newName,
    path: path.join(basePath, newName),
    content: '',
  };

  await saveFileContent(fileToSave);
};

const moveToFolder = async (moveItemPath: string, toFolderPath: string): Promise<void> => {
  const target = path.join(toFolderPath, path.basename(moveItemPath));
  if (target === moveItemPath) return;
  await fs.move(moveItemPath, target);
};

const rename = async (srcPath: string, newName: string) => {
  const onlyDir = path.dirname(srcPath);
  const targetPath = path.join(onlyDir, newName);
  await fs.move(srcPath, targetPath);
  return targetPath;
};

const remove = async (delPath: string): Promise<void> => {
  const folderFolDeleted = '/.trash/';
  const root = Settings.getRootPath();
  if (!root) return;
  const targetPath = path.join(root, folderFolDeleted, path.basename(delPath));
  await fs.move(delPath, targetPath);
};

export default {
  theWatcher,
  getFileTree,
  getFileContent,
  loadFilesFromFolder,
  saveFileContent,
  saveNewFile,
  remove,
  moveToFolder,
  rename,
};
