import * as path from 'path';
import * as fs from 'fs-extra';
import FileService from '../services/files';
import TagsStore from '../services/tags';
import TheWatcher from '../services/watcher';
import ParseGoodreadsCSV from '../services/goodreadsCsvParser';
import Setting from '../services/settings';
import { callWithoutEvent } from '/@/helpers/utils';

import type { ISavedFile } from '../services/files';
import { dialog } from 'electron';
import { format } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IIpcHandle = (...args: any) => any;

type IHandles = {
  [key: string]: IIpcHandle;
};

const handles: IHandles = {
  ///
  /// Files
  ///
  getFileTree: async () => {
    const rootPath = Setting.getRootPath();
    if (!rootPath) throw 'No Root Path';
    const files = await FileService.getFileTree(rootPath);
    return files;
  },
  loadFilesFromFolder: async (_, path: string, recursive = false) => {
    const files = await FileService.loadFilesFromFolder(path, recursive);
    TheWatcher.opened = { type: 'path', thing: path, recursive };
    return files;
  },
  loadFilesFromTag: async (_, tag: string) => {
    const files = await FileService.loadFilesFromTag(tag);
    TheWatcher.opened = { type: 'tag', thing: tag };
    return files;
  },
  loadFileContent: async (_, path: string) => {
    const file = await FileService.getFileContent(path);
    TheWatcher.opened = { type: 'file', thing: path };
    return file;
  },
  saveFileContent: async (_, file: ISavedFile) => {
    const currentTime = new Date();

    TheWatcher.filesIgnore[file.path] = new Date(currentTime.getTime() + 3000);

    await FileService.saveFileContent(file);
  },
  closeWatcher: TheWatcher.destroy,
  move: callWithoutEvent(FileService.moveToFolder),
  rename: callWithoutEvent(FileService.rename),
  delete: callWithoutEvent(FileService.remove),
  getTags: callWithoutEvent(TagsStore.getTags),

  ///
  /// Core
  ///
  init: async () => {
    const rootPath = Setting.getRootPath();
    if (rootPath) {
      await TheWatcher.init(rootPath);
      await FileService.loadTags(rootPath);
      return true;
    } else {
      return false;
    }
  },
  newRootPath: Setting.setRootPath,
  ///
  /// Settings
  ///
  getSettings: Setting.getStore,
  saveSettings: Setting.saveStore,
  newImagesPath: Setting.setImagesPath,

  ///
  /// Parsers
  ///
  parseGoodreadsCsv: async () => {
    const file = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Goodreads CSV', extensions: ['csv'] }],
    });

    if (file.canceled) return;
    const rootPath = Setting.getRootPath();
    if (!rootPath) return;

    const parsingResult = await ParseGoodreadsCSV(file.filePaths[0]);

    const saveTo = path.join(rootPath, `GoodReads Import ${format(new Date(), 'MM-dd HH-mm')}`);

    fs.ensureDirSync(saveTo);

    parsingResult.forEach(async (book) => {
      await FileService.saveNewFile(saveTo, book);
    });
  },
};

const initHandles = (ipcMain: Electron.IpcMain) => {
  Object.entries(handles).forEach((pair) => ipcMain.handle(pair[0], pair[1]));
};

export default initHandles;
