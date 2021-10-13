import type { IFolder } from '../../main/src/services/files';

interface ElectronApi {
  files: {
    getFilesFromFolder: (path?: string) => Promise<IFolder>;
    getFileContent: (path: string) => Promise<string>;
    saveFileContent: (path: string, data: string) => Promise<void>;
    watchFolder: (callback: (_, newFolder: IFolder) => void, path?: string) => Promise<void>;
    unwatchFolder: () => Promise<void>;
    watchFile: (callback: (_, fileContent: string) => void, path: string) => Promise<void>;
    unwatchFile: () => Promise<void>;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
