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

  FileService.fileWatcher.ignoreUntill = new Date(currentTime.getTime() + 3000);
  await FileService.saveFileContent(path, data);
};

const unwatchFolder: IIpcHandle = async () => {
  await FileService.folderWatcher.unWatch();
};

const unwatchFile: IIpcHandle = async () => {
  await FileService.fileWatcher.unWatch();
};

const handles: IHandles = {
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
  unwatchFolder,
  unwatchFile,
};

export default handles;
