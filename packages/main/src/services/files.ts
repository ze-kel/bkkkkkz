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
  filesWeCareAbout: {
    // If file key is here then we care about it.
    // If we have a date it means we ignore changes in this file until the timestamp
    [key: string]: Date | true;
  };
  init: (win: BrowserWindow, path: string) => Promise<void>;
  destroy: () => Promise<void>;
  watch: (path: string) => void;
  unwatch: (path: string) => void;
  verifyPath: IWatcherVerifyPath;
  sendUpdated?: IWatcherSendUpdated;
  ignoreNextUnlink: boolean;
};

const theWatcher: IWatcher = {
  watcher: null,
  path: null,
  filesWeCareAbout: {},
  ignoreNextUnlink: false,
  init: async function (win, path) {
    if (this.watcher) {
      await this.destroy();
    }

    this.verifyPath(path);

    this.path = path;

    this.watcher = chokidar.watch(path, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
    });

    if (!this.watcher) {
      throw 'Watcher was not created';
    }

    const sendUpdatedFolder = async () => {
      if (!this.path) {
        throw 'watcher triggered but has no path data';
      }
      const newFiles = await getFilesFromFolder(this.path);

      win.webContents.send('watchFolder', newFiles);
    };

    const sendUpdatedFile = async (path: string) => {
      console.log('SEND UPDATED', path);
      const careValue = this.filesWeCareAbout[path];

      if (!this.filesWeCareAbout[path]) {
        return;
      }

      if (careValue instanceof Date) {
        const currentTime = new Date();
        if (currentTime < careValue) {
          console.log('skip send update cause we have ignore date');
          return;
        } else {
          this.filesWeCareAbout[path] = true;
        }
      }

      const newFile = await getFileContent(path);

      win.webContents.send('watchFile', path, newFile);
    };

    const unlinkCheck = () => {
      if (this.ignoreNextUnlink) {
        this.ignoreNextUnlink = false;
      } else {
        sendUpdatedFolder();
      }
    };

    this.watcher
      .on('add', sendUpdatedFolder)
      .on('unlink', unlinkCheck)
      .on('addDir', sendUpdatedFolder)
      .on('unlinkDir', unlinkCheck)
      .on('change', sendUpdatedFile);
    this.watcher.on('ready', () => console.log('Initial scan complete. Ready for changes'));
  },
  destroy: async function () {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.path = null;
  },
  watch: function (path) {
    this.filesWeCareAbout[path] = true;
  },
  unwatch: function (path) {
    delete this.filesWeCareAbout[path];
  },
  verifyPath: function (path) {
    if (fs.lstatSync(path).isDirectory()) {
      return;
    } else {
      throw 'File path passed to watcher init';
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

const move = async (srcPath: string, targetPath: string): Promise<void> => {
  if (targetPath === srcPath) {
    return;
  }
  await fs.move(srcPath, targetPath);
};

export default {
  theWatcher,
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
  move,
};
