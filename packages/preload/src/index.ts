import { contextBridge, ipcRenderer } from 'electron';
import { callWithoutEvent } from '/@main/helpers/utils';
import { exposeElectronTRPC } from 'electron-trpc/main';

import type { ElectronApi } from 'types/electron-api';

const apiKey = 'electron';
const api: ElectronApi = {
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
};

contextBridge.exposeInMainWorld(apiKey, api);

process.once('loaded', async () => {
  exposeElectronTRPC();
});
