import { useElectron } from './electron';
import _debounce from 'lodash-es/debounce';

const api = useElectron();

type ICallback = (val: string) => void | Promise<void>;

const fileHandlers: {
  [path: string]: ICallback;
} = {};

const watchFile = async (path: string, callback: ICallback): Promise<string> => {
  fileHandlers[path] = callback;
  const result = await api.files.getFileContent(path);
  return result;
};

const unwatchFile = (path: string): void => {
  delete fileHandlers[path];
};

const handleChange = (_: Event, path: string, fileContent: string) => {
  if (!fileHandlers[path]) {
    return;
  }
  fileHandlers[path](fileContent);
};

const init = (): void => {
  api.files.setFileHandler(handleChange);
};

const save = (path: string, content: string): void => {
  api.files.saveFileContent(path, content);
};

const saveDebounce = _debounce(save, 1000);

export default { watchFile, unwatchFile, init, save, saveDebounce };
