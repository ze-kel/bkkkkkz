import type { IFolder, ILoadedFile, ILoadedFiles } from '/@main/services/files';
import type { ILocalSettings } from '/@main/services/localSettings';

import type {
  I_FILE_ADD,
  I_FILE_REMOVE,
  I_FILE_UPDATE,
  I_TREE_UPDATE,
  I_TAGS_UPDATE,
} from '/@main/ipc/webContents';
import type { ITags } from '/@main/services/tags';

interface ElectronApi {
  files: {
    getFileTree: (path?: string) => Promise<IFolder>;
    loadFilesFromFolder: (path: string, recursive?: boolean) => Promise<ILoadedFiles>;
    loadFilesFromTag: (tag: string) => Promise<ILoadedFiles>;
    saveFileContent: (file: ILoadedFile) => Promise<void>;

    move: (srcPath: string, targetPath: string) => Promise<string>;
    rename: (srcPath: string, newName: string) => Promise<string>;
    delete: (path: string) => void;

    getTags: () => Promise<ITags>;
  };
  subscriptions: {
    TREE_UPDATE: (callback: I_TREE_UPDATE) => void;
    FILE_UPDATE: (callback: I_FILE_UPDATE) => void;
    FILE_ADD: (callback: I_FILE_ADD) => void;
    FILE_REMOVE: (callback: I_FILE_REMOVE) => void;
    TAGS_UPDATE: (callback: I_TAGS_UPDATE) => void;
  };

  core: {
    init: () => Promise<boolean>;
  };
  settings: {
    newRootPath: () => Promise<boolean>;
    getSettings: () => Promise<ILocalSettings>;
    saveSettings: (_, newSettings: ILocalSettings) => Promise<void>;
    newImagesPath: () => Promise<ILocalSettings>;
  };
  parsers: {
    parseGoodreadsCsv: () => Promise<void>;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
