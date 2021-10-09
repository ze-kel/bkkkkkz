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
  await FileService.saveFileContent(path, data);
};

const unwatchFolder: IIpcHandle = async () => {
  await FileService.unwatchFolder();
};

const handles: IHandles = {
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
  unwatchFolder,
};

export default handles;
