import { contextBridge, ipcRenderer } from 'electron';
import { callWithoutEvent } from '/@main/helpers/utils';

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
    loadFilesFromTag: async (tag) => {
      const result = await ipcRenderer.invoke('loadFilesFromTag', tag);
      return result;
    },
    saveFileContent: async (file) => {
      const result = await ipcRenderer.invoke('saveFileContent', file);
      return result;
    },

    move: async (srcPath, targetPath) => {
      const result = await ipcRenderer.invoke('move', srcPath, targetPath);
      return result;
    },
    rename: async (srcPath, newName) => {
      const result = await ipcRenderer.invoke('rename', srcPath, newName);
      return result;
    },
    delete: async (path) => {
      await ipcRenderer.invoke('delete', path);
    },

    getTags: async () => {
      const result = await ipcRenderer.invoke('getTags');
      return result;
    },
  },
  subscriptions: {
    TREE_UPDATE: (callback) => {
      ipcRenderer.on('TREE_UPDATE', callWithoutEvent(callback));
    },
    FILE_UPDATE: (callback) => {
      ipcRenderer.on('FILE_UPDATE', callWithoutEvent(callback));
    },
    FILE_ADD: (callback) => {
      ipcRenderer.on('FILE_ADD', callWithoutEvent(callback));
    },
    FILE_REMOVE: (callback) => {
      ipcRenderer.on('FILE_REMOVE', callWithoutEvent(callback));
    },
    TAGS_UPDATE: (callback) => {
      ipcRenderer.on('TAGS_UPDATE', callWithoutEvent(callback));
    },
  },

  core: {
    init: async () => {
      const result = await ipcRenderer.invoke('init');
      return result;
    },
  },
  settings: {
    newRootPath: async () => {
      const result = await ipcRenderer.invoke('newRootPath');
      return result;
    },
    getSettings: async () => {
      const result = await ipcRenderer.invoke('getSettings');
      return result;
    },
    saveSettings: (newSettings) => {
      const result = ipcRenderer.invoke('saveSettings', newSettings);
      return result;
    },
    newImagesPath: async () => {
      const result = ipcRenderer.invoke('newImagesPath');
      return result;
    },
  },
  parsers: {
    parseGoodreadsCsv: async () => {
      const result = await ipcRenderer.invoke('parseGoodreadsCsv');
      return result;
    },
  },
};

contextBridge.exposeInMainWorld(apiKey, api);
