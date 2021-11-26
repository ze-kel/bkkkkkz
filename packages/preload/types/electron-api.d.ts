import type { IFolder, ILoadedFile, ILoadedFiles } from '/@main/services/files';
import type { ILocalSettings } from '/@main/services/localSettings';

interface ElectronApi {
  files: {
    getFileTree: (path?: string) => Promise<IFolder>;
    setTreeHandler: (callback: (_, newTree: IFolder) => void) => void;
    loadFilesFromFolder: (path: string, recursive?: boolean) => Promise<ILoadedFiles>;
    saveFileContent: (file: ILoadedFile) => Promise<void>;
    setFileHandler: (callback: (_, path: string, fileContent: ILoadedFile) => void) => void;
    setLoadedAddHandler: (callback: (_, path: string, fileContent: ILoadedFile) => void) => void;
    setLoadedRemoveHandler: (callback: (_, path: string) => void) => void;
    move: (srcPath: string, targetPath: string) => Promise<string>;
    rename: (srcPath: string, newName: string) => Promise<string>;
  };
  core: {
    init: () => Promise<boolean>;
  };
  settings: {
    newRootPath: () => Promise<boolean>;
    getSettings: () => Promise<ILocalSettings>;
    saveSettings: (_, newSettings: ILocalSettings) => Promise<void>;
    newImagesPath: () => Promise<ILocalSettings>;
  };
  parsers: {
    parseGoodreadsCsv: () => Promise<void>;
  };
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
