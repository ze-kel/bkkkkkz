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
      const result = await ipcRenderer.invoke('saveFileContent', path, data);
      return result;
    },
    watchFolder: async (callback) => {
      ipcRenderer.on('watchFolder', callback);

      await ipcRenderer.invoke('watchFolder');
    },
    unwatchFolder: async () => {
      await ipcRenderer.invoke('unwatchFolder');
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
