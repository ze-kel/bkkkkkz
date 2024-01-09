import * as path from 'path';
import * as fs from 'fs-extra';

import { makeBookFile, makeEncodedBook } from './books';
import { getSettings } from './settings';
import TagsStore from '../watcher/tagUpdates';

import { DOTFILE_REGEX, FILENAME_REGEX } from '../helpers/utils';
import { dialog } from 'electron';
import { zBookData } from './books';
import { z } from 'zod';
import { getRootPathSafe } from './rootPath';
import { sendNotificationToUser } from '../ipc/api';

export type IFolderTree = {
  type: 'folder';
  name: string;
  path: string;
  content: {
    [key: string]: IFolderTree;
  };
};

export const zUnsavedFile = zBookData.and(
  z.object({
    content: z.string().optional(),
    name: z.string().optional(),
    unsaved: z.literal<boolean>(true),
  }),
);

export type IUnsavedFile = z.infer<typeof zUnsavedFile>;

export const zSavedFile = zBookData.and(
  z.object({
    content: z.string().optional(),
    name: z.string(),
    unsaved: z.literal<boolean>(false).optional(),
    path: z.string(),
  }),
);
export type ISavedFile = z.infer<typeof zSavedFile>;

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

const loadFilesFromFolder = async (basePath: string, recursive?: boolean): Promise<IFiles> => {
  if (!fs.existsSync) {
    throw new Error('Directory does not exist');
  }

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

  const fileToSave = {
    ...file,
    unsaved: false,
    name: newName,
    path: path.join(basePath, newName),
  };

  await saveFileContent(fileToSave);

  return fileToSave;
};

const saveNewFiles = async (basePath: string, files: IUnsavedFile[]): Promise<void> => {
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
  // TODO: handle collisions
  await fs.move(srcPath, targetPath);
  // TODO: send notification
  return targetPath;
};

const remove = async (delPath: string): Promise<void> => {
  const root = getRootPathSafe();
  if (!root) return;
  // TODO: send notification
  await fs.remove(delPath);
};

const locateCover = (filename: string) => {
  const root = getRootPathSafe();
  const localSettings = getSettings();
  return path.join(root, localSettings.coversPath, filename);
};

const removeCover = async (filePath: string): Promise<void> => {
  const book = await getFileContent(filePath);
  if (!book.cover) throw 'Trying to delete cover from book without one';
  const coverPath = locateCover(book.cover);
  await fs.remove(coverPath);
  delete book.cover;
  await saveFileContent(book);

  sendNotificationToUser({
    title: 'Deleted',
    text: 'Cover removed and deleted from disk',
  });
};

// Takes filename for cover we want to save and returns path to save it.
// Can accept both "filename.ext" and "/folder/filename.ext"
const getPathForCoverSaving = (coverFile: string): string => {
  const localSettings = getSettings();
  const root = getRootPathSafe();

  fs.ensureDirSync(path.join(root, localSettings.coversPath));

  const ext = path.extname(coverFile);
  let coverFileName = path.parse(coverFile).name;

  while (fs.existsSync(path.join(root, localSettings.coversPath, coverFileName + ext))) {
    coverFileName += '(1)';
  }

  return path.join(root, localSettings.coversPath, coverFileName + ext);
};

const setCover = async (filePath: string) => {
  const root = getRootPathSafe();
  const book = await getFileContent(filePath);
  const file = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
  });
  if (file.filePaths.length) {
    const selectedFile = file.filePaths[0];

    const filename = path.basename(selectedFile);

    const pathToSave = getPathForCoverSaving(filename);

    await fs.copyFile(selectedFile, path.join(root, pathToSave));

    book.cover = path.basename(pathToSave);
    saveFileContent(book);
  }
};

const createFolder = (pathForFolder: string, name: string) => {
  const newPath = path.join(pathForFolder, name);
  fs.mkdirSync(path.join(pathForFolder, name));
  return newPath;
};

const saveCoverFromBlob = async (fileNameWithExtension: string, imageBlob: Blob) => {
  const path = getPathForCoverSaving(fileNameWithExtension);

  await fs.writeFile(path, Buffer.from(await imageBlob.arrayBuffer()));
  return path;
};

const fetchCover = async (filePath: string) => {
  const book = await getFileContent(filePath);
  if (!book.ISBN13 || (String(book.ISBN13).length !== 13 && String(book.ISBN13).length !== 10)) {
    sendNotificationToUser({
      title: 'Unable to fetch',
      text: 'ISBN is incorrect. It should be 10 or 13 numbers.',
    });
    return;
  }

  sendNotificationToUser({
    title: 'Trying to fetch cover',
    text: 'Please wait',
  });

  const res = await fetch(`https://covers.openlibrary.org/b/ISBN/${book.ISBN13}-L.jpg`);

  if (res.status !== 200) {
    sendNotificationToUser({
      title: 'Unable to fetch',
      text: 'OpenLibrary has no cover awailable for this ISBN',
    });
    return;
  }

  const cover = await res.blob();

  // Sometimes API returns empty 1px by 1px image. Treat this as if we got 404
  if (cover.size / 1000 < 5) {
    sendNotificationToUser({
      title: 'Unable to fetch',
      text: 'OpenLibrary has no cover awailable for this ISBN',
    });
    return;
  }

  const bookFilePath = await saveCoverFromBlob(String(book.ISBN13), cover);
  book.cover = path.basename(bookFilePath);
  saveFileContent(book);

  sendNotificationToUser({
    title: 'Got cover',
    text: 'OpenLibrary found cover for this ISBN, added it.',
  });
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
  removeCover,
  locateCover,
  setCover,
  createFolder,
  fetchCover,
};
