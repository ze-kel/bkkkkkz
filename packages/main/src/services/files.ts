import * as path from 'path';
import * as fs from 'fs-extra';

import { makeBookFile, makeEncodedBook } from './books';
import Settings from './settings';
import TagsStore from './tags';
import type { IBookData } from './books';

import { DOTFILE_REGEX, FILENAME_REGEX } from '../helpers/utils';
import { dialog } from 'electron';

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
  name?: string;
  unsaved: true;
}

export interface ISavedFile extends Omit<IUnsavedFile, 'unsaved'> {
  path: string;
  name: string;
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

  const result = makeBookFile(filePath, path.basename(filePath));
  return result;
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
        if (path.extname(fullPath) === '.md') {
          const fileContent = await getFileContent(fullPath);
          result[fullPath] = fileContent;
        }
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

const saveNewFile = async (basePath: string, file: IUnsavedFile): Promise<ISavedFile> => {
  let newName;

  if (file.name) {
    newName = file.name;
    if (!path.extname(newName)) {
      newName += '.md';
    }
  } else {
    newName = `${file.author ? file.author : 'unknown'} — ${
      file.title ? file.title.split(':')[0] : 'unknown'
    }.md`;
  }

  newName = newName.replace(FILENAME_REGEX, '');

  let uniquenessNumber = 2;

  while (fs.existsSync(path.join(basePath, newName))) {
    newName = `${newName} (${uniquenessNumber})`;
    uniquenessNumber++;
  }

  const fileToSave: ISavedFile = {
    ...file,
    name: newName,
    path: path.join(basePath, newName),
  };

  await saveFileContent(fileToSave);

  return fileToSave;
};

const saveNewFiles = async (basePath: string, files: IUnsavedFile[]): Promise<void> => {
  console.log('SAVING files', files.length);

  await Promise.all(files.map((file) => saveNewFile(basePath, file)));
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
  const root = Settings.getRootPathSafe();
  const localSettings = Settings.getStore();
  if (!root) return;
  const targetPath = path.join(root, localSettings.trashPath, path.basename(delPath));
  await fs.move(delPath, targetPath);
};

const loadTags = async (rootPath: string): Promise<void> => {
  const allFiles = await loadFilesFromFolder(rootPath, true);
  TagsStore.addFilesBatch(Object.values(allFiles));
};

const locateCover = (filename: string) => {
  const root = Settings.getRootPathSafe();
  const localSettings = Settings.getStore();
  return path.join(root, localSettings.coversPath, filename);
};

const removeCover = async (filePath: string): Promise<void> => {
  const book = await getFileContent(filePath);
  if (!book.cover) throw 'Trying to delete cover from book without one';
  const coverPath = locateCover(book.cover);
  await fs.remove(coverPath);
  delete book.cover;
  await saveFileContent(book);
};

const setCover = async (filePath: string) => {
  const localSettings = Settings.getStore();
  const root = Settings.getRootPathSafe();

  const book = await getFileContent(filePath);
  const file = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }],
  });
  if (file.filePaths.length) {
    const selectedFile = file.filePaths[0];

    const fileWithExt = path.basename(selectedFile);
    const ext = path.extname(fileWithExt);

    let coverFileName = fileWithExt.replace(ext, '');

    while (fs.existsSync(path.join(root, localSettings.coversPath, coverFileName))) {
      coverFileName += '(1)';
    }
    fs.copyFile(selectedFile, path.join(root, localSettings.coversPath, coverFileName + ext));

    const previous = book.cover || null;

    book.cover = coverFileName + ext;
    saveFileContent(book);

    if (previous) await fs.remove(locateCover(previous));
  }
};

const createFolder = (pathForFolder: string, name: string) => {
  const newPath = path.join(pathForFolder, name);
  fs.mkdirSync(path.join(pathForFolder, name));
  return newPath;
};

export default {
  getFileTree,
  getFileContent,
  loadFilesFromFolder,
  loadFilesFromTag,
  saveFileContent,
  saveNewFile,
  saveNewFiles,
  remove,
  moveToFolder,
  rename,
  loadTags,
  removeCover,
  locateCover,
  setCover,
  createFolder,
};
