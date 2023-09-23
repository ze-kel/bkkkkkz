import { initTRPC } from '@trpc/server';
import type { IFolderTree, ISavedFile } from '../services/files';
import FileService, { zSavedFile, zUnsavedFile } from '../services/files';
import { z } from 'zod';
import { FileUpdates } from '../watcher/fileUpdates';
import { getOpenedTabs, setOpenedTabs, ZOpenedTabs } from '../services/openedTabs';
import type { ITags } from '../watcher/tagUpdates';
import TagsStore from '../watcher/tagUpdates';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { getRootPath, setRootPath } from '../services/rootPath';
import { getSettings, saveSettings, zSettings } from '../services/settings';
import { getReadChallenge, saveReadChallenge, zReadChallenge } from '../services/readChalenge';

export type INotification = {
  title: string;
  text: string;
};

const t = initTRPC.create({ isServer: true });

export const apiEventsEmitter = new EventEmitter();

export const sendNotificationToUser = (notif: INotification) => {
  apiEventsEmitter.emit('SEND_NOTIFICATION', notif);
};

export const appRouter = t.router({
  getFileTree: t.procedure.query(async () => {
    const rootPath = getRootPath();
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

  getOpenedTabs: t.procedure.query(async () => {
    return await getOpenedTabs();
  }),

  setOpenedTabs: t.procedure.input(ZOpenedTabs).mutation(async ({ input }) => {
    return await setOpenedTabs(input);
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

  removeCoverFile: t.procedure
    .input(z.object({ bookFilePath: z.string() }))
    .mutation(async ({ input }) => {
      return await FileService.removeCover(input.bookFilePath);
    }),

  setCover: t.procedure
    .input(z.object({ bookFilePath: z.string() }))
    .mutation(async ({ input }) => {
      return await FileService.setCover(input.bookFilePath);
    }),

  /// askldjasldk
  fetchCover: t.procedure
    .input(z.object({ bookFilePath: z.string() }))
    .mutation(async ({ input }) => {
      return await FileService.fetchCover(input.bookFilePath);
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

  getRootPath: t.procedure.query(() => {
    return getRootPath();
  }),

  setRootPath: t.procedure.mutation(async () => {
    return await setRootPath();
  }),

  getSettings: t.procedure.query(async () => {
    return await getSettings();
  }),

  saveSettings: t.procedure.input(zSettings).mutation(async ({ input }) => {
    return await saveSettings(input);
  }),

  getReadChallenge: t.procedure.query(async () => {
    return await getReadChallenge();
  }),

  saveReadChallenge: t.procedure.input(zReadChallenge).mutation(async ({ input }) => {
    return await saveReadChallenge(input);
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

  sendNotification: t.procedure.subscription(() => {
    return observable<INotification>((emit) => {
      function onThing(data: INotification) {
        emit.next(data);
      }
      apiEventsEmitter.on('SEND_NOTIFICATION', onThing);
      return () => {
        apiEventsEmitter.off('SEND_NOTIFICATION', onThing);
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
    apiEventsEmitter.removeAllListeners('SEND_NOTIFICATION');
  }),
});

type I_FILE_UPDATE = { file: ISavedFile; relevantIndexes: number[] };
type I_FILE_REMOVE = { path: string; relevantIndexes: number[] };

type I_FILE_ADD = { file: ISavedFile; relevantIndexes: number[] };
type I_TREE_UPDATE = IFolderTree;
type I_TAGS_UPDATE = ITags;

export type AppRouter = typeof appRouter;
