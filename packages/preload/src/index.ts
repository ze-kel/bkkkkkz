import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronApi } from 'types/electron-api';

const apiKey = 'electron';
/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api: ElectronApi = {
  files: {
    getFilesFromFolder: async () => {
      const result = await ipcRenderer.invoke('getFilesFromFolder');
      return result;
    },
    getFileContent: async (path) => {
      const result = await ipcRenderer.invoke('getFileContent', path);
      return result;
    },
    saveFileContent: async (path, data) => {
      console.log('api Save File Content', data);
      const result = await ipcRenderer.invoke('saveFileContent', path, data);
      return result;
    },
    initWatcher: async (callback) => {
      ipcRenderer.on('watchFolder', callback);
      await ipcRenderer.invoke('initWatcher');
    },
    closeWatcher: async () => {
      await ipcRenderer.invoke('closeWatcher');
    },
    watchFile: async (callback, path) => {
      ipcRenderer.on('watchFile', callback);
      const result = await ipcRenderer.invoke('watchFile', path);
      return result;
    },
    unwatchFile: async (path) => {
      await ipcRenderer.invoke('watchFile', path);
    },
    move: async (srcPath, targetPath) => {
      await ipcRenderer.invoke('move', srcPath, targetPath);
    },
    rename: async (srcPath, newName) => {
      await ipcRenderer.invoke('rename', srcPath, newName);
    },
  },
};

/**
 * The "Main World" is the JavaScript context that your main renderer code runs in.
 * By default, the page you load in your renderer executes code in this world.
 *
 * @see https://www.electronjs.org/docs/api/context-bridge
 */
contextBridge.exposeInMainWorld(apiKey, api);
