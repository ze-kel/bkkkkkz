import * as path from 'path';
import * as fs from 'fs-extra';

import { makeBookFile, makeEncodedBook } from './books';
import Settings from './settings';
import type { IBookData } from './books';

import { DOTFILE_REGEX, FILENAME_REGEX } from '../helpers/utils';

export type IFolderTree = {
  type: 'folder';
  name: string;
  path: string;
  content: {
    [key: string]: IFolderTree;
  };
};

export type IUnsavedFile = IBookData;

export interface ISavedFile extends IUnsavedFile {
  name: string;
  path: string;
  content: string;
}

export type IFile = ISavedFile;

export type IFiles = {
  [key: string]: IFile;
};

const getFileTree = (basePath: string): IFolderTree => {
  fs.ensureDirSync(basePath);

  const files = fs.readdirSync(basePath);

  const output: IFolderTree = {
    type: 'folder',
    name: path.basename(basePath),
    path: basePath,
    content: {},
  };

  files.forEach((file: string) => {
    if (DOTFILE_REGEX.test(file)) return;
    if (fs.statSync(path.join(basePath, file)).isDirectory()) {
      output.content[file] = getFileTree(path.join(basePath, file));
    }
  });

  return output;
};

const getFileContent = async (filePath: string): Promise<ISavedFile> => {
  if (!fs.existsSync(filePath)) {
    throw new Error('No such file');
  }

  return makeBookFile(filePath, path.basename(filePath));
};

const loadFilesFromFolder = async (basePath: string, recursive: boolean): Promise<IFiles> => {
  fs.ensureDirSync(basePath);
  const files = fs.readdirSync(basePath);

  const result: IFiles = {};

  await Promise.all(
    files.map(async (file: string) => {
      const fullPath = path.join(basePath, file);
      if (DOTFILE_REGEX.test(file)) return;

      if (fs.statSync(fullPath).isDirectory()) {
        if (recursive) {
          const moreFiles = await loadFilesFromFolder(fullPath, recursive);
          Object.entries(moreFiles).forEach(async ([path, content]) => {
            result[path] = content;
          });
        }
        return;
      } else {
        const fileContent = await getFileContent(fullPath);
        result[fullPath] = fileContent;
      }
    }),
  );

  return result;
};

const saveFileContent = async (file: ISavedFile): Promise<void> => {
  const encoded = makeEncodedBook(file);
  await fs.writeFile(file.path, encoded);
};

const saveNewFile = async (basePath: string, file: IUnsavedFile): Promise<void> => {
  const baseName = `${file.author ? file.author : 'unknown'} — ${
    file.title ? file.title : 'unknown'
  }`.replace(FILENAME_REGEX, '');
  let newName = baseName;
  let uniquenessNumber = 2;

  while (fs.existsSync(path.join(basePath, newName))) {
    newName = `${baseName} (${uniquenessNumber})`;
    uniquenessNumber++;
  }

  const fileToSave: ISavedFile = {
    ...file,
    name: newName,
    path: path.join(basePath, newName),
    content: '',
  };

  await saveFileContent(fileToSave);
};

const moveToFolder = async (moveItemPath: string, toFolderPath: string): Promise<void> => {
  const target = path.join(toFolderPath, path.basename(moveItemPath));
  if (target === moveItemPath) return;
  await fs.move(moveItemPath, target);
};

const rename = async (srcPath: string, newName: string) => {
  const onlyDir = path.dirname(srcPath);
  const targetPath = path.join(onlyDir, newName);
  await fs.move(srcPath, targetPath);
  return targetPath;
};

const remove = async (delPath: string): Promise<void> => {
  const folderFolDeleted = '/.trash/';
  const root = Settings.getRootPath();
  if (!root) return;
  const targetPath = path.join(root, folderFolDeleted, path.basename(delPath));
  await fs.move(delPath, targetPath);
};

export default {
  getFileTree,
  getFileContent,
  loadFilesFromFolder,
  saveFileContent,
  saveNewFile,
  remove,
  moveToFolder,
  rename,
};
