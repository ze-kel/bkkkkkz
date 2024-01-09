import { app, dialog } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import TheWatcher from '../watcher/watcherCore';

const folderPath = process.env['FORCE_USER_PATH']
  ? process.env['FORCE_USER_PATH']
  : app.getPath('userData');
const jsonPath = path.join(folderPath, 'path.json');

export const getRootPath = (): string | null => {
  if (!fs.existsSync(jsonPath)) {
    return null;
  }

  const str = fs.readFileSync(jsonPath).toString();
  const json = JSON.parse(str);

  if (!json.path) {
    return null;
  }

  if (!fs.existsSync(json.path)) {
    return null;
  }

  return json.path;
};

export const getRootPathSafe = (): string => {
  const path = getRootPath();

  if (path === null) {
    throw new Error('Trying to do operation that requires root path, but it is not set yet');
  }

  return path;
};

const getSelectedPath = async () => {
  if (process.env['FAKE_SET_ROOT_DIR']) {
    return process.env['FAKE_SET_ROOT_DIR'];
  }

  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (folder.filePaths.length) {
    return folder.filePaths[0];
  }
};

export const setRootPath = async () => {
  const path = await getSelectedPath();

  if (path) {
    fs.ensureDirSync(folderPath);
    const toSave = JSON.stringify({ path });
    await fs.writeFile(jsonPath, toSave);
    const w = await TheWatcher.init();
    if (!w) {
      throw new Error('Error initting watcher after setting root path');
    }
    return true;
  }

  return false;
};
