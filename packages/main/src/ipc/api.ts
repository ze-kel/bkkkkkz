import { initTRPC } from '@trpc/server';
import type { IFolderTree, ISavedFile } from '../services/files';
import FileService, { zSavedFile, zUnsavedFile } from '../services/files';
import type { ILocalSettings } from '../services/settings';
import Settings from '../services/settings';
import { z } from 'zod';
import { FileUpdates } from '../watcher/fileUpdates';
import { updateOpened, zOpened } from '../watcher/openedTabs';
import type { ITags } from '../watcher/tagUpdates';
import TagsStore from '../watcher/tagUpdates';
import TheWatcher from '../watcher/watcherCore';
import { format } from 'date-fns';
import { dialog } from 'electron';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import { observable } from '@trpc/server/observable';
import ParseGoodreadsCSV from '../services/goodreadsCsvParser';
import { EventEmitter } from 'events';

const t = initTRPC.create({ isServer: true });

export const apiEventsEmitter = new EventEmitter();

export const appRouter = t.router({
  getFileTree: t.procedure.query(async () => {
    const rootPath = Settings.getRootPath();
    if (!rootPath) throw new Error('No Root Path');
    const files = await FileService.getFileTree(rootPath);
    return files;
  }),
  loadFilesFromFolder: t.procedure
    .input(z.object({ path: z.string(), recursive: z.boolean().optional() }))
    .query(async ({ input }) => {
      const { path, recursive } = input;
      const files = await FileService.loadFilesFromFolder(path, recursive);
      return files;
    }),

  loadFilesFromTag: t.procedure.input(z.string()).query(async ({ input }) => {
    return FileService.loadFilesFromTag(input);
  }),

  loadFileContent: t.procedure.input(z.string()).query(async ({ input }) => {
    return FileService.getFileContent(input);
  }),

  saveFileContent: t.procedure.input(zSavedFile).mutation(async ({ input }) => {
    const currentTime = new Date();
    FileUpdates.ignored[input.path] = new Date(currentTime.getTime() + 3000);
    return await FileService.saveFileContent(input);
  }),

  syncOpened: t.procedure
    .input(z.object({ opened: z.array(zOpened), index: z.number() }))
    .mutation(async ({ input }) => {
      const { opened, index } = input;
      updateOpened(opened);
      Settings.saveLastOpened(opened, index);
    }),

  move: t.procedure
    .input(z.object({ moveItemPath: z.string(), toFolderPath: z.string() }))
    .mutation(async ({ input }) => {
      return await FileService.moveToFolder(input.moveItemPath, input.toFolderPath);
    }),

  rename: t.procedure
    .input(z.object({ srcPath: z.string(), newName: z.string() }))
    .mutation(async ({ input }) => {
      return await FileService.rename(input.srcPath, input.newName);
    }),

  delete: t.procedure.input(z.string()).mutation(async ({ input }) => {
    return await FileService.remove(input);
  }),

  getTags: t.procedure.query(async () => {
    return TagsStore.getTags();
  }),

  removeCoverFile: t.procedure.input(z.string()).mutation(async ({ input }) => {
    return await FileService.removeCover(input);
  }),

  setCover: t.procedure.input(z.string()).mutation(async ({ input }) => {
    return await FileService.setCover(input);
  }),

  createFolder: t.procedure
    .input(z.object({ pathToFolder: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      return await FileService.createFolder(input.pathToFolder, input.name);
    }),

  saveNewFile: t.procedure
    .input(z.object({ basePath: z.string(), file: zUnsavedFile }))
    .mutation(async ({ input }) => {
      return await FileService.saveNewFile(input.basePath, input.file);
    }),

  saveNewFiles: t.procedure
    .input(z.object({ basePath: z.string(), files: z.array(zUnsavedFile) }))
    .mutation(async ({ input }) => {
      return await FileService.saveNewFiles(input.basePath, input.files);
    }),

  init: t.procedure.query(async () => {
    const rootPath = Settings.getRootPath();
    if (rootPath) {
      await TheWatcher.init(rootPath);
      return true;
    } else {
      return false;
    }
  }),
  newRootPath: t.procedure.mutation(async () => {
    return await Settings.setRootPath();
  }),

  getSettings: t.procedure.query(async () => {
    return await Settings.getStore();
  }),

  saveSettings: t.procedure.input(z.any()).mutation(async ({ input }) => {
    // should type probably
    return await Settings.saveStore(input as ILocalSettings);
  }),

  parseGoodreadsCsv: t.procedure.mutation(async () => {
    const file = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Goodreads CSV', extensions: ['csv'] }],
    });

    if (file.canceled) return;
    const rootPath = Settings.getRootPath();
    if (!rootPath) return;

    const parsingResult = await ParseGoodreadsCSV(file.filePaths[0]);

    const saveTo = path.join(rootPath, `GoodReads Import ${format(new Date(), 'MM-dd HH-mm')}`);

    fs.ensureDirSync(saveTo);

    parsingResult.forEach(async (book) => {
      await FileService.saveNewFile(saveTo, book);
    });
  }),

  isTest: t.procedure.query(() => {
    return process.env['TEST_MODE'];
  }),

  fileUpdate: t.procedure.subscription(() => {
    return observable<I_FILE_UPDATE>((emit) => {
      function onThing(data: I_FILE_UPDATE) {
        emit.next(data);
      }
      apiEventsEmitter.on('FILE_UPDATE', onThing);
      return () => {
        apiEventsEmitter.off('FILE_UPDATE', onThing);
      };
    });
  }),
  fileRemove: t.procedure.subscription(() => {
    return observable<I_FILE_REMOVE>((emit) => {
      function onThing(data: I_FILE_REMOVE) {
        emit.next(data);
      }
      apiEventsEmitter.on('FILE_REMOVE', onThing);
      return () => {
        apiEventsEmitter.off('FILE_REMOVE', onThing);
      };
    });
  }),
  fileAdd: t.procedure.subscription(() => {
    return observable<I_FILE_ADD>((emit) => {
      function onThing(data: I_FILE_ADD) {
        emit.next(data);
      }
      apiEventsEmitter.on('FILE_ADD', onThing);
      return () => {
        apiEventsEmitter.off('FILE_ADD', onThing);
      };
    });
  }),
  treeUpdate: t.procedure.subscription(() => {
    return observable<I_TREE_UPDATE>((emit) => {
      function onThing(data: I_TREE_UPDATE) {
        emit.next(data);
      }
      apiEventsEmitter.on('TREE_UPDATE', onThing);
      return () => {
        apiEventsEmitter.off('TREE_UPDATE', onThing);
      };
    });
  }),
  tagsUpdate: t.procedure.subscription(() => {
    return observable<I_TAGS_UPDATE>((emit) => {
      function onThing(data: I_TAGS_UPDATE) {
        emit.next(data);
      }
      apiEventsEmitter.on('TAGS_UPDATE', onThing);
      return () => {
        apiEventsEmitter.off('TAGS_UPDATE', onThing);
      };
    });
  }),
  settingsUpdate: t.procedure.subscription(() => {
    return observable<I_SETTING_UPDATE>((emit) => {
      function onThing(data: I_SETTING_UPDATE) {
        emit.next(data);
      }
      apiEventsEmitter.on('SETTINGS_UPDATE', onThing);
      return () => {
        apiEventsEmitter.off('SETTINGS_UPDATE', onThing);
      };
    });
  }),
  clearAllEvents: t.procedure.mutation(() => {
    apiEventsEmitter.removeAllListeners('FILE_UPDATE');
    apiEventsEmitter.removeAllListeners('FILE_REMOVE');
    apiEventsEmitter.removeAllListeners('FILE_ADD');
    apiEventsEmitter.removeAllListeners('TREE_UPDATE');
    apiEventsEmitter.removeAllListeners('TAGS_UPDATE');
    apiEventsEmitter.removeAllListeners('SETTINGS_UPDATE');
  }),
});

type I_FILE_UPDATE = { file: ISavedFile; relevantIndexes: number[] };
type I_FILE_REMOVE = { path: string; relevantIndexes: number[] };

type I_FILE_ADD = { file: ISavedFile; relevantIndexes: number[] };
type I_TREE_UPDATE = IFolderTree;
type I_TAGS_UPDATE = ITags;
type I_SETTING_UPDATE = ILocalSettings;

export type AppRouter = typeof appRouter;
