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
    setFileHandler: (callback) => {
      ipcRenderer.on('watchFile', callback);
    },
    move: async (srcPath, targetPath) => {
      const result = await ipcRenderer.invoke('move', srcPath, targetPath);
      return result;
    },
    rename: async (srcPath, newName) => {
      const result = await ipcRenderer.invoke('rename', srcPath, newName);
      return result;
    },
  },
};

contextBridge.exposeInMainWorld(apiKey, api);
