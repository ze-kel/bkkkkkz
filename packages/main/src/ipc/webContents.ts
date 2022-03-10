import type { BrowserWindow } from 'electron';
import type { IFolderTree, ISavedFile } from '../services/files';
import type { ITags } from '../watcher/tagUpdates';
import type { ILocalSettings } from '../services/settings';

type I_FILE_UPDATE = (newFile: ISavedFile, relevantIndexex: number[]) => void;
type I_FILE_REMOVE = (unlinkedPath: string, relevantIndexex: number[]) => void;
type I_FILE_ADD = (file: ISavedFile, relevantIndexex: number[]) => void;

type I_TREE_UPDATE = (newFile: IFolderTree) => void;

type I_TAGS_UPDATE = (tags: ITags) => void;

type I_SETTING_UPDATE = (settings: ILocalSettings) => void;

type IWebContents = {
  window: BrowserWindow | null;
  setWindow: (w: BrowserWindow) => void;

  FILE_ADD: I_FILE_ADD;
  FILE_UPDATE: I_FILE_UPDATE;
  FILE_REMOVE: I_FILE_REMOVE;

  TREE_UPDATE: I_TREE_UPDATE;

  TAGS_UPDATE: I_TAGS_UPDATE;
  SETTINGS_UPDATE: I_SETTING_UPDATE;
};

function getSender(label: string) {
  return function (this: IWebContents, ...args: unknown[]) {
    if (!this) return;
    this.window?.webContents.send(label, ...args);
  };
}

const WebContentsProxy: IWebContents = {
  window: null,
  setWindow(window) {
    this.window = window;
  },

  FILE_ADD: getSender('FILE_ADD'),
  FILE_UPDATE: getSender('FILE_UPDATE'),
  FILE_REMOVE: getSender('FILE_REMOVE'),

  TREE_UPDATE: getSender('TREE_UPDATE'),

  TAGS_UPDATE: getSender('TAGS_UPDATE'),

  SETTINGS_UPDATE: getSender('SETTINGS_UPDATE'),
};

export default WebContentsProxy;
