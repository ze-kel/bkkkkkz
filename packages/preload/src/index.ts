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
    loadFileContent: async (path) => {
      const result = await ipcRenderer.invoke('loadFileContent', path);
      return result;
    },
    saveFileContent: async (file) => {
      const result = await ipcRenderer.invoke('saveFileContent', file);
      return result;
    },
    syncOpened: async (opened, index) => {
      const result = await ipcRenderer.invoke('syncOpened', opened, index);
      return result;
    },

    removeCoverFile: async (path) => {
      const result = await ipcRenderer.invoke('removeCoverFile', path);
      return result;
    },
    setCover: async (path) => {
      const result = await ipcRenderer.invoke('setCover', path);
      return result;
    },

    createFolder: async (path, name) => {
      await ipcRenderer.invoke('createFolder', path, name);
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
      const noEvent = callWithoutEvent(callback);
      ipcRenderer.on('TREE_UPDATE', noEvent);
      return () => {
        ipcRenderer.removeListener('TREE_UPDATE', noEvent);
      };
    },
    FILE_UPDATE: (callback) => {
      const noEvent = callWithoutEvent(callback);
      ipcRenderer.on('FILE_UPDATE', noEvent);
      return () => {
        ipcRenderer.removeListener('FILE_UPDATE', noEvent);
      };
    },
    FILE_ADD: (callback) => {
      const noEvent = callWithoutEvent(callback);
      ipcRenderer.on('FILE_ADD', noEvent);
      return () => {
        ipcRenderer.removeListener('FILE_ADD', noEvent);
      };
    },
    FILE_REMOVE: (callback) => {
      const noEvent = callWithoutEvent(callback);
      ipcRenderer.on('FILE_REMOVE', noEvent);
      return () => {
        ipcRenderer.removeListener('FILE_REMOVE', noEvent);
      };
    },
    TAGS_UPDATE: (callback) => {
      const noEvent = callWithoutEvent(callback);
      ipcRenderer.on('TAGS_UPDATE', noEvent);
      return () => {
        ipcRenderer.removeListener('TAGS_UPDATE', noEvent);
      };
    },
    SETTINGS_UPDATE: (callback) => {
      const noEvent = callWithoutEvent(callback);
      ipcRenderer.on('SETTINGS_UPDATE', noEvent);
      return () => {
        ipcRenderer.removeListener('SETTINGS_UPDATE', noEvent);
      };
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
  },
  parsers: {
    parseGoodreadsCsv: async () => {
      const result = await ipcRenderer.invoke('parseGoodreadsCsv');
      return result;
    },
  },
};

contextBridge.exposeInMainWorld(apiKey, api);
