import type { BrowserWindow } from 'electron';
import type { IFolderTree, ISavedFile } from '../services/files';

type I_FILE_UPDATE = (path: string, newFile: ISavedFile) => void;
type I_FILE_REMOVE = (unlinkedPath: string) => void;
type I_FILE_ADD = (path: string, file: ISavedFile) => void;

type I_TREE_UPDATE = (newFile: IFolderTree) => void;

type IWebContents = {
  window: BrowserWindow | null;
  setWindow: (w: BrowserWindow) => void;

  FILE_ADD: I_FILE_ADD;
  FILE_UPDATE: I_FILE_UPDATE;
  FILE_REMOVE: I_FILE_REMOVE;

  TREE_UPDATE: I_TREE_UPDATE;
};

function getSender(label: string) {
  return function (this: IWebContents, ...args: unknown[]) {
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
};

export default WebContentsProxy;
