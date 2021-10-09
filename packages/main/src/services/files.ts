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

let folderWatcher: FSWatcher | null = null;
let watchedFolder: string | null = null;

const watchFolder = async (win: BrowserWindow, path: string): Promise<void> => {
  if (folderWatcher) {
    await unwatchFolder();
  }

  watchedFolder = path;

  folderWatcher = chokidar.watch(path, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
  });

  const log = console.log.bind(console);

  log('watching folder and sending whatsup');

  const sendUpdated = async () => {
    if (!watchedFolder) {
      throw 'watcher triggered but has no watchedFolder data';
    }
    const newFiles = await getFilesFromFolder(watchedFolder);

    win.webContents.send('watchFolder', newFiles);
  };

  if (!folderWatcher) {
    throw 'Watcher was not created';
  }

  // Add event listeners.

  folderWatcher.on('add', sendUpdated).on('change', sendUpdated).on('unlink', sendUpdated);

  // More possible events.
  folderWatcher.on('ready', () => log('Initial scan complete. Ready for changes'));
};

const unwatchFolder = async () => {
  if (folderWatcher) {
    await folderWatcher.close();
    folderWatcher = null;
  }
  watchedFolder = null;
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
  watchFolder,
  unwatchFolder,
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
};
