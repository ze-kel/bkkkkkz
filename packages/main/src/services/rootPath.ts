import { app, dialog } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import TheWatcher from '../watcher/watcherCore';

const folderPath = app.getPath('userData');
const jsonPath = path.join(folderPath, 'path.json');

export const getRootPath = (): string | null => {
  if (process.env['FORCE_ROOT_PATH']) {
    return process.env['FORCE_ROOT_PATH'];
  }

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

export const setRootPath = async () => {
  const folder = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (folder.filePaths.length) {
    fs.ensureDirSync(folderPath);
    const toSave = JSON.stringify({ path: folder.filePaths[0] });
    await fs.writeFile(jsonPath, toSave);
    const w = await TheWatcher.init();
    if (!w) {
      throw new Error('Error initting watcher after setting root path');
    }
    return true;
  }

  return false;
};
