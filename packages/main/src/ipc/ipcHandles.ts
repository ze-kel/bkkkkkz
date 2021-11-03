import * as path from 'path';
import FileService from '../services/files';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IIpcHandle = (...args: any) => any;

type IHandles = {
  [key: string]: IIpcHandle;
};

const getFilesFromFolder: IIpcHandle = async (_, path = './files') => {
  console.log(path);
  const files = await FileService.getFilesFromFolder(path);
  return files;
};

const getFileContent: IIpcHandle = async (_, path: string) => {
  const file = await FileService.getFileContent(path);
  return file;
};

const saveFileContent: IIpcHandle = async (_, path: string, data: string) => {
  const currentTime = new Date();

  FileService.theWatcher.filesIgnore[path] = new Date(currentTime.getTime() + 3000);

  await FileService.saveFileContent(path, data);
};

const closeWatcher: IIpcHandle = async () => {
  await FileService.theWatcher.destroy();
};

const move: IIpcHandle = async (_, srcPath: string, targetPath: string) => {
  // TargetPath we get looks like 'pathto/folder' where we want to place src. fs.move wants 'pathto/folder/fileName.md'
  targetPath = path.join(targetPath, path.basename(srcPath));
  FileService.theWatcher.ignoreNextUnlink = true;
  await FileService.move(srcPath, targetPath);
  return targetPath;
};

const rename: IIpcHandle = async (_, srcPath: string, newName: string) => {
  const onlyDir = path.dirname(srcPath);
  const targetPath = path.join(onlyDir, newName);
  await FileService.move(srcPath, targetPath);
  return targetPath;
};

const handles: IHandles = {
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
  closeWatcher,
  move,
  rename,
};

export default handles;
