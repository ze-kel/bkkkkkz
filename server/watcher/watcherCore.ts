import { DOTFILE_REGEX, DOTDIR_REGEX } from '../../api/utils';
import { extname } from '@tauri-apps/api/path';

import * as FileService from '~/api/files';
import { FileUpdates } from './fileUpdates';
import { FolderUpdates } from './folderTreeUpdates';
import { TagUpdates } from './tagUpdates';

import type { ISavedFile } from '../../api/files';
import { exists, watch, watchImmediate, type WatchEvent } from '@tauri-apps/plugin-fs';

export type IWatcherFunction = (path: string) => void | Promise<void>;
export type IWatcherFunctionFFile = (file: ISavedFile) => void | Promise<void>;
export type IWatcherFunctionFFiles = (files: ISavedFile[]) => void | Promise<void>;

export interface IWatcherModule {
  initialize?: () => void;
  initialFiles?: IWatcherFunctionFFiles;
  addFile?: IWatcherFunctionFFile;
  unlinkFile?: IWatcherFunction;
  changeFile?: IWatcherFunctionFFile;
  addDir?: IWatcherFunction;
  unlinkDir?: IWatcherFunction;
  [propName: string]: unknown;
}

type IWatcher = {
  unwatchFunction?: Awaited<ReturnType<typeof watch>>;
  modules: IWatcherModule[];
  init: () => Promise<boolean>;
};

const TheWatcher: IWatcher = {
  modules: [FileUpdates, FolderUpdates, TagUpdates],
  init: async function () {
    if (this.unwatchFunction) {
      await this.unwatchFunction();
    }

    const rootPath = rootPathFromStore();
    if (!rootPath) return false;

    if (!(await exists(rootPath))) {
      throw 'File path passed to watcher init';
    }

    this.modules.forEach(async (module) => {
      if (module.initialize) module.initialize();
    });

    const add = async (itemPath: string) => {
      if ((await extname(itemPath)) !== '.md') return;
      const file = await FileService.getFileContent(itemPath);
      this.modules.forEach(async (module) => {
        if (module.addFile) await module.addFile(file);
      });
    };

    const unlink = async (itemPath: string) => {
      if (!itemPath.endsWith('.md')) return;
      this.modules.forEach(async (module) => {
        if (module.unlinkFile) await module.unlinkFile(itemPath);
      });
    };

    const change = async (itemPath: string) => {
      if (!itemPath.endsWith('.md')) return;
      const file = await FileService.getFileContent(itemPath);
      this.modules.forEach(async (module) => {
        if (module.changeFile) await module.changeFile(file);
      });
    };

    const addDir = async (path: string) => {
      this.modules.forEach(async (module) => {
        if (module.addDir) await module.addDir(path);
      });
    };

    const unlinkDir = async (path: string) => {
      this.modules.forEach(async (module) => {
        if (module.unlinkDir) await module.unlinkDir(path);
      });
    };

    const initialFiles = await FileService.loadFilesFromFolder({
      basePath: rootPath,
      recursive: true,
    });
    this.modules.forEach(async (module) => {
      if (module.initialFiles) await module.initialFiles(Object.values(initialFiles));
    });

    const handler = async (event: WatchEvent) => {
      console.log(event);
      const t = event.type;
      const p = event.paths.filter((p) => !DOTFILE_REGEX.test(p) && !DOTDIR_REGEX.test(p));
      if (typeof t == 'string') return;

      if ('create' in t) {
        if (t.create.kind === 'folder') {
          await Promise.all(p.map(async (v) => await addDir(v)));
        }

        if (t.create.kind === 'file') {
          await Promise.all(p.map(async (v) => await add(v)));
        }
      }

      if ('modify' in t) {
        await Promise.all(p.map(async (v) => await change(v)));
      }

      if ('remove' in t) {
        if (t.remove.kind === 'folder') {
          await Promise.all(p.map(async (v) => await unlinkDir(v)));
        }

        if (t.remove.kind === 'file') {
          await Promise.all(p.map(async (v) => await unlink(v)));
        }
      }
    };

    this.unwatchFunction = await watchImmediate(rootPath, handler, { recursive: true });

    return true;
  },
};

export default TheWatcher;
