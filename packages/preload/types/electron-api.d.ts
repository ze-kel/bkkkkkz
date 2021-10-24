import type { IFolder } from '../../main/src/services/files';

interface ElectronApi {
  files: {
    getFilesFromFolder: (path?: string) => Promise<IFolder>;
    getFileContent: (path: string) => Promise<string>;
    saveFileContent: (path: string, data: string) => Promise<void>;
    initWatcher: (callback: (_, newFolder: IFolder) => void, path?: string) => Promise<void>;
    closeWatcher: () => Promise<void>;
    watchFile: (
      callback: (_, path: string, fileContent: string) => void,
      path: string,
    ) => Promise<string>;
    unwatchFile: (path: string) => Promise<void>;
    move: (srcPath: string, targetPath: string) => Promise<void>;
    rename: (srcPath: string, newName: string) => Promise<void>;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
