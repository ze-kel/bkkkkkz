import * as path from 'path';
import * as fs from 'fs-extra';
import { dialog } from 'electron';
import type * as IStore from 'electron-store';
import type { IOpened } from '../watcher/openedTabs';
import { apiEventsEmitter } from '../ipc/api';
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
  dateLocale: {
    type: 'string',
    default: 'en-GB',
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
  lastOpened: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        thing: {
          type: 'string',
        },
      },
    },
    default: [],
  },
  lastActiveIndex: {
    type: 'number',
    default: -1,
  },
  readChallenges: {
    type: 'object',
    properties: {
      '/': {},
    },
    patternProperties: {
      '^[0-9]+': {
        type: 'object',
        properties: {
          year: {
            type: 'number',
          },
          books: {
            type: 'number',
          },
        },
      },
    },
    default: {},
  },
};

export type IReadChallengeData = {
  year: number;
  books: number;
};

export type ILocalSettings = {
  recursiveFolders: boolean;
  rootPath: string;
  dateFormat: string;
  dateLocale: string;
  coversPath: string;
  trashPath: string;
  splitTitle: boolean;
  darkMode: -1 | 0 | 1;
  lastOpened: IOpened[];
  lastActiveIndex: number;
  readChallenges: Record<number, IReadChallengeData>;
};

const globalStore: IStore = new Store();
let localStore: IStore<ILocalSettings> | undefined;

const getRootPath = (): string | null => {
  if (process.env['FORCE_ROOT_PATH']) {
    return process.env['FORCE_ROOT_PATH'];
  }
  const data = globalStore.get('rootPath');
  if (data && typeof data === 'string' && fs.existsSync(data)) {
    return data;
  }
  return null;
};

const getRootPathSafe = (): string => {
  const path = getRootPath();

  if (path === null) {
    // eslint-disable-next-line quotes
    throw "Trying to do operation that requires root path, but it isn't set yet";
  }
  return path;
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
    sendUpdatesToClient();
  }
};

const sendUpdatesToClient = () => {
  apiEventsEmitter.emit('SETTINGS_UPDATE', getStore());
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

const getLastOpened = () => {
  if (!localStore) {
    initStore();
    if (!localStore) {
      throw 'Failed to init local Store';
    }
  }

  return {
    opened: localStore.store.lastOpened,
    activeOpenedIndex: localStore.store.lastActiveIndex,
  };
};

const saveLastOpened = (opened: IOpened[], activeOpenedIndex: number) => {
  if (!localStore) {
    initStore();
    if (!localStore) {
      throw 'Failed to init local Store';
    }
  }
  localStore.set('lastOpened', opened);
  localStore.set('lastActiveIndex', activeOpenedIndex);
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
  getLastOpened,
  saveLastOpened,
};
