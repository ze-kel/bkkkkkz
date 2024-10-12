import { DOTFILE_REGEX, DOTDIR_REGEX } from '../../api/utils';
import { extname } from '@tauri-apps/api/path';

import * as FileService from '~/api/files';
import { FileUpdates } from './fileUpdates';
import { FolderUpdates } from './folderTreeUpdates';

import type { ISavedFile } from '../../api/files';
import { exists, lstat, watch, watchImmediate, type WatchEvent } from '@tauri-apps/plugin-fs';
import { MetaCache } from '~/api/watcher/metaCache';

export type IWatcherFunction = (path: string) => void | Promise<void>;
export type IWatcherFunctionFFile = (file: ISavedFile, path: string) => void | Promise<void>;
export type IWatcherFunctionFFiles = (files: FileService.IFiles) => void | Promise<void>;

export interface IWatcherModule {
  initialize?: () => void;
  initialFile?: IWatcherFunctionFFiles;
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

const safeExtname = (path: string) => {
  try {
    return extname(path);
  } catch (e) {
    return '';
  }
};

const TheWatcher: IWatcher = {
  modules: [FileUpdates, FolderUpdates, MetaCache],
  init: async function () {
    if (this.unwatchFunction) {
      await this.unwatchFunction();
    }

    const rootPath = rootPathFromStore();
    if (!rootPath) return false;

    if (!(await exists(rootPath))) {
      throw 'File path passed to watcher does not exists';
    }

    this.modules.forEach(async (module) => {
      if (module.initialize) module.initialize();
    });

    const add = async (itemPath: string) => {
      if ((await extname(itemPath)) !== 'md') return;
      const file = await FileService.getFileContent(itemPath);
      this.modules.forEach(async (module) => {
        if (module.addFile) await module.addFile(file, itemPath);
      });
    };

    const unlink = async (itemPath: string) => {
      if ((await extname(itemPath)) !== 'md') return;
      this.modules.forEach(async (module) => {
        if (module.unlinkFile) await module.unlinkFile(itemPath);
      });
      console.log('unlinked fil;');
    };

    const change = async (itemPath: string) => {
      if ((await extname(itemPath)) !== 'md') return;
      const file = await FileService.getFileContent(itemPath);
      this.modules.forEach(async (module) => {
        if (module.changeFile) await module.changeFile(file, itemPath);
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
      if (module.initialFile) await module.initialFile(initialFiles);
    });

    const handler = async (event: WatchEvent) => {
      console.log(event);
      const t = event.type;
      const p = event.paths.filter((p) => !DOTFILE_REGEX.test(p) && !DOTDIR_REGEX.test(p));
      if (typeof t == 'string' || !p.length) return;

      if ('create' in t) {
        if (t.create.kind === 'folder') {
          await Promise.all(p.map(async (v) => await addDir(v)));
        }

        if (t.create.kind === 'file') {
          await Promise.all(p.map(async (v) => await add(v)));
        }
      }

      if ('modify' in t) {
        if (t.modify.kind === 'data') {
          await Promise.all(p.map(async (v) => await change(v)));
        }

        if (t.modify.kind === 'rename') {
          // Rename is called two times: for original name and for new name
          // (This might be not true for debounced watcher, but rn I use immediate one)
          // Move to bin is also rename, but we only get original name(cause we don't watch bin folder)
          await Promise.all(
            p.map(async (v) => {
              try {
                const stat = await lstat(v);

                if (stat.isDirectory) {
                  await addDir(v);
                } else {
                  await add(v);
                }
              } catch (e) {
                // lstat will fail if file\folder was deleted
                if ((await safeExtname(v)) === '') {
                  await unlinkDir(v);
                } else {
                  unlink(v);
                }
              }
            }),
          );
        }
      }

      if ('remove' in t) {
        if (t.remove.kind === 'folder') {
          await Promise.all(p.map(async (v) => await unlinkDir(v)));
        }

        if (t.remove.kind === 'file') {
          await Promise.all(p.map(async (v) => await unlink(v)));
        }
      }

      if ('rename' in t) {
        t.rename;
      }
    };

    this.unwatchFunction = await watchImmediate(rootPath, handler, { recursive: true });

    return true;
  },
};

export default TheWatcher;
