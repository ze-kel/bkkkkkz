import * as path from 'path';
import * as fs from 'fs-extra';
import { dialog } from 'electron';
import type * as IStore from 'electron-store';
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
};

export type ILocalSettings = {
  imagesPath: string;
  recursiveFolders: boolean;
  rootPath: string;
};

const globalStore: IStore = new Store();
let localStore: IStore | undefined;

const getRootPath = (): string | null => {
  const data = globalStore.get('rootPath');
  if (data && typeof data === 'string' && fs.existsSync(data)) {
    return data;
  }
  return null;
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

const setImagesPath = async () => {
  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (folder.filePaths.length) {
    const path = folder.filePaths[0];
    if (!localStore) {
      initStore();
      if (!localStore) {
        throw 'Failed to init local Store';
      }
    }
    localStore.set('imagesPath', path);
  }
  return getStore();
};

export default { setRootPath, getRootPath, initStore, getStore, saveStore, setImagesPath };
