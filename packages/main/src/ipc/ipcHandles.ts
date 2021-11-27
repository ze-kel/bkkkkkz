import * as path from 'path';
import * as fs from 'fs-extra';
import FileService from '../services/files';
import ParseGoodreadsCSV from '../services/goodreadsCsvParser';
import Setting from '../services/settings';

import type { ISavedFile } from '../services/files';
import type { BrowserWindow } from 'electron';
import { dialog } from 'electron';
import { format } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IIpcHandle = (...args: any) => any;

type IHandles = {
  [key: string]: IIpcHandle;
};

const initHandles = (ipcMain: Electron.IpcMain, mainWindow: BrowserWindow) => {
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
      FileService.theWatcher.loadedPath = { path, recursive };
      return files;
    },
    saveFileContent: async (_, file: ISavedFile) => {
      const currentTime = new Date();

      FileService.theWatcher.filesIgnore[file.path] = new Date(currentTime.getTime() + 3000);

      await FileService.saveFileContent(file);
    },
    closeWatcher: async () => {
      await FileService.theWatcher.destroy();
    },
    move: async (_, srcPath: string, targetPath: string) => {
      // TargetPath we get looks like 'pathto/folder'. fs.move wants 'pathto/folder/fileName.md'
      targetPath = path.join(targetPath, path.basename(srcPath));

      await FileService.moveFile(srcPath, targetPath);
      return targetPath;
    },
    rename: async (_, srcPath: string, newName: string) => {
      const onlyDir = path.dirname(srcPath);
      const targetPath = path.join(onlyDir, newName);
      await FileService.moveFile(srcPath, targetPath);
      return targetPath;
    },
    delete: async (_, path: string) => {
      await FileService.deleteFile(path);
    },

    ///
    /// Core
    ///
    init: async () => {
      const rootPath = Setting.getRootPath();
      if (rootPath) {
        FileService.theWatcher.init(mainWindow, rootPath);
        return true;
      } else {
        return false;
      }
    },
    newRootPath: async () => await Setting.setRootPath(),
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
      console.log('saveTo', saveTo);

      fs.ensureDirSync(saveTo);

      parsingResult.forEach(async (book) => {
        console.log('saving', book.title);
        await FileService.saveNewFile(saveTo, book);
      });
    },
  };

  Object.entries(handles).forEach((pair) => ipcMain.handle(pair[0], pair[1]));
};

export default initHandles;
