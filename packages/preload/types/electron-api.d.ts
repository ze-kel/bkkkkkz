import type {
  I_FILE_ADD,
  I_FILE_REMOVE,
  I_FILE_UPDATE,
  I_TREE_UPDATE,
  I_TAGS_UPDATE,
  I_SETTINGS_UPDATE,
} from '/@main/ipc/webContents';

interface ElectronApi {
  subscriptions: {
    TREE_UPDATE: (callback: I_TREE_UPDATE) => () => void;
    FILE_UPDATE: (callback: I_FILE_UPDATE) => () => void;
    FILE_ADD: (callback: I_FILE_ADD) => () => void;
    FILE_REMOVE: (callback: I_FILE_REMOVE) => () => void;
    TAGS_UPDATE: (callback: I_TAGS_UPDATE) => () => void;
    SETTINGS_UPDATE: (callback: I_SETTINGS_UPDATE) => () => void;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
