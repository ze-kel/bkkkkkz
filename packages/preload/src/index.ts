import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronApi } from 'types/electron-api';

const apiKey = 'electron';
const api: ElectronApi = {
  files: {
    getFileTree: async () => {
      const result = await ipcRenderer.invoke('getFileTree');
      return result;
    },
    loadFilesFromFolder: async (path, recursive) => {
      const result = await ipcRenderer.invoke('loadFilesFromFolder', path, recursive);
      return result;
    },
    saveFileContent: async (file) => {
      const result = await ipcRenderer.invoke('saveFileContent', file);
      return result;
    },
    setTreeHandler: (callback) => {
      ipcRenderer.on('FOLDER_TREE', callback);
    },
    setFileHandler: (callback) => {
      ipcRenderer.on('FILE_UPDATE', callback);
    },
    setLoadedAddHandler: (callback) => {
      ipcRenderer.on('FILE_ADD', callback);
    },
    setLoadedRemoveHandler: (callback) => {
      ipcRenderer.on('FILE_REMOVE', callback);
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
