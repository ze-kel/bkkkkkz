// Settings in user directory
import { dialog } from 'electron';
import * as fs from 'fs-extra';
const Store = require('electron-store');

const store = new Store();

const getRootPath = (): string | null => {
  const data = store.get('rootPath');
  if (data && typeof data === 'string' && fs.existsSync(data)) {
    return data;
  }
  return null;
};

const setRootPath = async () => {
  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  const path = folder.filePaths[0];

  store.set('rootPath', path);
};

export default { getRootPath, setRootPath };
