import * as path from 'path';
import * as fs from 'fs-extra';
import { dialog } from 'electron';
import type * as IStore from 'electron-store';
import WebContentsProxy from '../ipc/webContents';
const Store = require('electron-store');

const SETTINGS_PATH = '.bkz';
const SCHEMA = {
  imagesPath: {
    type: 'string',
    default: '',
  },
  recursiveFolders: {
    type: 'boolean',
    default: false,
  },
  dateFormat: {
    type: 'string',
    default: 'yyyy-MM-dd',
  },
  coversPath: {
    type: 'string',
    default: '.covers',
  },
  trashPath: {
    type: 'string',
    default: '.trash',
  },
  splitTitle: {
    type: 'boolean',
    default: true,
  },
  darkMode: {
    type: 'number',
    default: 0,
    minimum: -1,
    maximum: 1,
  },
};

export type ILocalSettings = {
  recursiveFolders: boolean;
  rootPath: string;
  dateFormat: string;
  coversPath: string;
  trashPath: string;
  splitTitle: boolean;
  darkMode: -1 | 0 | 1;
};

const globalStore: IStore = new Store();
let localStore: IStore<ILocalSettings> | undefined;

const getRootPath = (): string | null => {
  const data = globalStore.get('rootPath');
  if (data && typeof data === 'string' && fs.existsSync(data)) {
    return data;
  }
  return null;
};

const getRootPathSafe = (): string => {
  const data = globalStore.get('rootPath');
  if (data && typeof data === 'string' && fs.existsSync(data)) {
    return data;
  }
  // eslint-disable-next-line quotes
  throw "Trying to do operation that requires root path, but it isn't set yet";
};

const setRootPath = async () => {
  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (folder.filePaths.length) {
    const path = folder.filePaths[0];
    globalStore.set('rootPath', path);
    initStore();
    return true;
  }
  return false;
};

const initStore = () => {
  const rootPath = getRootPath();
  if (rootPath) {
    localStore = new Store({ cwd: path.join(rootPath, SETTINGS_PATH), schema: SCHEMA });
    localStore?.onDidAnyChange((newValue) => {
      if (!newValue) return;
      WebContentsProxy.SETTINGS_UPDATE({ ...newValue, rootPath });
    });
  }
};

const getStore = (): ILocalSettings => {
  if (!localStore) {
    initStore();
    if (!localStore) {
      throw 'Failed to init local Store';
    }
  }
  const store = { ...localStore.store, rootPath: getRootPath() } as ILocalSettings;
  return store;
};

const saveStore = (settings: ILocalSettings) => {
  if (!localStore) {
    initStore();
    if (!localStore) {
      throw 'Failed to init local Store';
    }
  }
  localStore.store = settings;
};

const getLocalSettings = (): ILocalSettings => {
  if (!localStore) throw 'No local store';
  return localStore.store;
};

export default {
  setRootPath,
  getRootPathSafe,
  getRootPath,
  initStore,
  getStore,
  saveStore,
  getLocalSettings,
};
