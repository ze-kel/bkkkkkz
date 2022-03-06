import type {
  IFolder,
  ILoadedFile,
  ILoadedFiles,
  ISavedFile,
  IUnsavedFile,
} from '/@main/services/files';
import type { ILocalSettings } from '/@main/services/localSettings';
import type { IOpened } from '/@main/services/watcher';

import type {
  I_FILE_ADD,
  I_FILE_REMOVE,
  I_FILE_UPDATE,
  I_TREE_UPDATE,
  I_TAGS_UPDATE,
  I_SETTINGS_UPDATE,
} from '/@main/ipc/webContents';
import type { ITags } from '/@main/services/tags';

interface ElectronApi {
  files: {
    getFileTree: (path?: string) => Promise<IFolder>;
    loadFilesFromFolder: (path: string, recursive?: boolean) => Promise<ILoadedFiles>;
    loadFilesFromTag: (tag: string) => Promise<ILoadedFiles>;
    loadFileContent: (path: string) => Promise<ILoadedFile>;
    saveFileContent: (file: ILoadedFile) => Promise<void>;
    syncOpened: (opened: IOpened[], index: number | null) => Promise<void>;

    removeCoverFile: (path: string) => Promise<void>;
    setCover: (path: string) => Promise<void>;

    createFolder: (path: string, name: string) => Promise<string>;

    move: (srcPath: string, targetPath: string) => Promise<string>;
    rename: (srcPath: string, newName: string) => Promise<string>;
    delete: (path: string) => void;

    getTags: () => Promise<ITags>;

    saveNewFile: (basePath: string, newFile: IUnsavedFile) => Promise<ISavedFile>;
    saveNewFiles: (basePath: string, newFiles: IUnsavedFile[]) => Promise<void>;
  };
  subscriptions: {
    TREE_UPDATE: (callback: I_TREE_UPDATE) => () => void;
    FILE_UPDATE: (callback: I_FILE_UPDATE) => () => void;
    FILE_ADD: (callback: I_FILE_ADD) => () => void;
    FILE_REMOVE: (callback: I_FILE_REMOVE) => () => void;
    TAGS_UPDATE: (callback: I_TAGS_UPDATE) => () => void;
    SETTINGS_UPDATE: (callback: I_SETTINGS_UPDATE) => () => void;
  };

  core: {
    init: () => Promise<boolean>;
    isTest: () => Promise<boolean>;
  };
  settings: {
    newRootPath: () => Promise<boolean>;
    getSettings: () => Promise<ILocalSettings>;
    saveSettings: (newSettings: ILocalSettings) => Promise<void>;
  };
  parsers: {
    parseGoodreadsCsv: () => Promise<void>;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
