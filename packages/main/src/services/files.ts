import type { FSWatcher } from 'chokidar';
import type { BrowserWindow } from 'electron';
const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');

export type IFile = {
  type: 'file';
  name: string;
  path: string;
};

export type IFolder = {
  type: 'folder';
  name: string;
  path: string;
  content: {
    [key: string]: IFile | IFolder;
  };
};

type IWatcherVerifyPath = (path: string) => void;
type IWatcherSendUpdated = () => Promise<void>;

type IWatcher = {
  watcher: FSWatcher | null;
  path: string | null;
  ignoreUntill?: Date | null;
  watch: (win: BrowserWindow, path: string) => Promise<void>;
  unWatch: () => Promise<void>;
  verifyPath: IWatcherVerifyPath;
  sendUpdated?: IWatcherSendUpdated;
};

const folderWatcher: IWatcher = {
  watcher: null,
  path: null,
  watch: async function (win, path) {
    if (this.watcher) {
      await this.unWatch();
    }

    this.verifyPath(path);

    this.path = path;

    this.watcher = chokidar.watch(path, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
    });

    const sendUpdated = async () => {
      if (!this.path) {
        throw 'watcher triggered but has no path data';
      }
      const newFiles = await getFilesFromFolder(this.path);

      win.webContents.send('watchFolder', newFiles);
    };

    if (!this.watcher) {
      throw 'Watcher was not created';
    }

    this.watcher
      .on('add', sendUpdated)
      .on('unlink', sendUpdated)
      .on('addDir', sendUpdated)
      .on('unlinkDir', sendUpdated);
    this.watcher.on('ready', () => console.log('Initial scan complete. Ready for changes'));
  },
  unWatch: async function () {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.path = null;
  },
  verifyPath: function (path) {
    if (fs.lstatSync(path).isDirectory()) {
      return;
    } else {
      throw 'File path passed to folderWatcher';
    }
  },
};

const fileWatcher: IWatcher = {
  watcher: null,
  path: null,
  ignoreUntill: null,
  watch: async function (win, path) {
    if (this.watcher) {
      await this.unWatch();
    }

    if (fs.lstatSync(path).isDirectory()) {
      throw 'Folder path passed into fileWatcher';
    }

    this.path = path;
    this.ignoreUntill = null;

    this.watcher = chokidar.watch(path, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
    });

    const sendUpdated = async () => {
      if (!this.path) {
        throw 'watcher triggered but has no path data';
      }
      const currentTime = new Date();

      if (this.ignoreUntill) {
        if (currentTime < this.ignoreUntill) {
          console.log('skippind send update cause we have ignoreUntill');
          return;
        } else {
          this.ignoreUntill = null;
        }
      }

      const newFile = await getFileContent(this.path);

      win.webContents.send('watchFile', newFile);
    };

    if (!this.watcher) {
      throw 'Watcher was not created';
    }

    this.watcher.on('add', sendUpdated).on('change', sendUpdated).on('unlink', sendUpdated);
    this.watcher.on('ready', () => console.log('Initial scan complete. Ready for changes'));
  },
  unWatch: async function () {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.path = null;
  },
  verifyPath: function (path) {
    if (!fs.lstatSync(path).isDirectory()) {
      return;
    } else {
      throw 'Folder path passed to fileWatcher';
    }
  },
};

const getFilesFromFolder = (basePath: string): IFolder => {
  fs.ensureDirSync(basePath);

  const files = fs.readdirSync(basePath);

  const output: IFolder = {
    type: 'folder',
    name: path.basename(basePath),
    path: basePath,
    content: {},
  };

  files.forEach((file: string) => {
    if (fs.statSync(path.join(basePath, file)).isDirectory()) {
      output.content[file] = getFilesFromFolder(path.join(basePath, file));
    } else {
      output.content[file] = {
        type: 'file',
        name: file,
        path: path.join(basePath, file),
      };
    }
  });

  return output;
};

const getFileContent = async (path: string): Promise<string> => {
  if (!fs.existsSync(path)) {
    throw new Error('No such file');
  }
  const file = await fs.readFile(path);

  return file.toString();
};

const saveFileContent = async (path: string, data: string): Promise<void> => {
  await fs.writeFile(path, data);
};

export default {
  folderWatcher,
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
  fileWatcher,
};
