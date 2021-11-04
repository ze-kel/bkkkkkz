import type { IFolder, ILoadedFile, ILoadedFiles } from '../../main/src/services/files';

interface ElectronApi {
  files: {
    getFileTree: (path?: string) => Promise<IFolder>;
    setTreeHandler: (callback: (_, newTree: IFolder) => void) => void;
    loadFilesFromFolder: (path: string) => Promise<ILoadedFiles>;
    saveFileContent: (file: ILoadedFile) => Promise<void>;
    setFileHandler: (callback: (_, path: string, fileContent: ILoadedFile) => void) => void;
    setLoadedAddHandler: (callback: (_, path: string, fileContent: ILoadedFile) => void) => void;
    setLoadedRemoveHandler: (callback: (_, path: string) => void) => void;
    move: (srcPath: string, targetPath: string) => Promise<string>;
    rename: (srcPath: string, newName: string) => Promise<string>;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
