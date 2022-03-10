import * as path from 'path';
import * as fs from 'fs-extra';
import FileService from '../services/files';
import TagsStore from '../watcher/tagUpdates';
import TheWatcher from '../watcher/watcherCore';
import ParseGoodreadsCSV from '../services/goodreadsCsvParser';
import Settings from '../services/settings';
import { FileUpdates } from '/@/watcher/fileUpdates';

import { dialog } from 'electron';
import { format } from 'date-fns';
import { callWithoutEvent } from '/@/helpers/utils';

import { updateOpened } from '../watcher/openedTabs';

import type { ISavedFile } from '../services/files';
import type { IOpened } from '../watcher/openedTabs';

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
    const rootPath = Settings.getRootPath();
    if (!rootPath) throw 'No Root Path';
    const files = await FileService.getFileTree(rootPath);
    return files;
  },
  loadFilesFromFolder: async (_, path: string, recursive = false) => {
    const files = await FileService.loadFilesFromFolder(path, recursive);
    return files;
  },
  loadFilesFromTag: async (_, tag: string) => {
    const files = await FileService.loadFilesFromTag(tag);
    return files;
  },
  loadFileContent: async (_, path: string) => {
    const file = await FileService.getFileContent(path);
    return file;
  },
  saveFileContent: async (_, file: ISavedFile) => {
    const currentTime = new Date();

    FileUpdates.ignored[file.path] = new Date(currentTime.getTime() + 3000);

    await FileService.saveFileContent(file);
  },

  syncOpened: (_, opened: IOpened[], index: number) => {
    updateOpened(opened);
    Settings.saveLastOpened(opened, index);
  },
  closeWatcher: TheWatcher.destroy,
  move: callWithoutEvent(FileService.moveToFolder),
  rename: callWithoutEvent(FileService.rename),
  delete: callWithoutEvent(FileService.remove),
  getTags: callWithoutEvent(TagsStore.getTags),
  removeCoverFile: callWithoutEvent(FileService.removeCover),
  setCover: callWithoutEvent(FileService.setCover),

  createFolder: callWithoutEvent(FileService.createFolder),

  saveNewFile: callWithoutEvent(FileService.saveNewFile),
  saveNewFiles: callWithoutEvent(FileService.saveNewFiles),

  ///
  /// Core
  ///
  init: async () => {
    const rootPath = Settings.getRootPath();
    if (rootPath) {
      await TheWatcher.init(rootPath);
      await FileService.loadTags(rootPath);
      return true;
    } else {
      return false;
    }
  },
  isTest: () => {
    return process.env['TEST_MODE'] === 'true';
  },

  newRootPath: Settings.setRootPath,
  ///
  /// Settings
  ///
  getSettings: Settings.getStore,
  saveSettings: callWithoutEvent(Settings.saveStore),

  ///
  /// Parsers
  ///
  parseGoodreadsCsv: async () => {
    const file = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Goodreads CSV', extensions: ['csv'] }],
    });

    if (file.canceled) return;
    const rootPath = Settings.getRootPath();
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
