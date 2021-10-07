import FileService from '../services/files';

type IIpcHandle = (arg0: any, arg1: any) => any;

type IHandles = {
  [key: string]: IIpcHandle;
};

const getFilesFromFolder: IIpcHandle = async (path?: string) => {
  const files = await FileService.getFilesFromFolder(path || './files');
  return files;
};

const getFileContent: IIpcHandle = async (path: string) => {
  const file = await FileService.getFileContent(path);
  return file;
};

const saveFileContent: IIpcHandle = async (path: string, data: string) => {
  await FileService.saveFileContent(path, data);
};

const handles: IHandles = {
  getFilesFromFolder,
  getFileContent,
  saveFileContent,
};

export default handles;
