import * as path from 'path';
import * as fs from 'fs-extra';

import { makeBookFile, makeEncodedBook } from './books';
import Settings from './settings';
import TagsStore from './tags';
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

export interface IUnsavedFile extends IBookData {
  content?: string;
  name: string;
  unsaved: true;
}

export interface ISavedFile extends Omit<IUnsavedFile, 'unsaved'> {
  path: string;
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

const loadFilesFromTag = async (tag: string): Promise<IFiles> => {
  const result: IFiles = {};

  const filesToGet = TagsStore.getTagPaths(tag);

  await Promise.all(
    filesToGet.map(async (filePath) => {
      const fileContent = await getFileContent(filePath);
      result[filePath] = fileContent;
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

const moveToFolder = async (moveItemPath: string, toFolderPath: string): Promise<string> => {
  const target = path.join(toFolderPath, path.basename(moveItemPath));
  if (target === moveItemPath) return moveItemPath;
  await fs.move(moveItemPath, target);
  return target;
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

const loadTags = async (rootPath: string): Promise<void> => {
  const allFiles = await loadFilesFromFolder(rootPath, true);
  TagsStore.addFilesBatch(Object.values(allFiles));
};

export default {
  getFileTree,
  getFileContent,
  loadFilesFromFolder,
  loadFilesFromTag,
  saveFileContent,
  saveNewFile,
  remove,
  moveToFolder,
  rename,
  loadTags,
};
