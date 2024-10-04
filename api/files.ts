import * as path from '@tauri-apps/api/path';

import { makeBookFile, makeEncodedBook } from './books';
import { getSettings } from './settings';
import { open } from '@tauri-apps/plugin-dialog';

import { DOTDIR_REGEX, DOTFILE_REGEX, FILENAME_REGEX } from './utils';
import { zBookData } from './books';
import { z } from 'zod';
import {
  readDir,
  exists,
  writeTextFile,
  rename,
  writeFile,
  copyFile,
  mkdir,
} from '@tauri-apps/plugin-fs';
import { FileUpdates } from '~/api/watcher/fileUpdates';
import { add } from 'date-fns';

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

const showNotification = (n: INotification) => {
  const store = useStore();
  store.showNotification(n);
};

export const getFileTree = async (basePath: string) => {
  const files = await readDir(basePath);

  const baseName = await path.basename(basePath);

  const output: IFolderTree = {
    type: 'folder',
    name: baseName,
    path: basePath,
    content: {},
  };

  await Promise.all(
    files.map(async (entry) => {
      if (entry.isDirectory && !DOTFILE_REGEX.test(entry.name) && !DOTDIR_REGEX.test(entry.name)) {
        const r = await getFileTree(await path.join(basePath, entry.name));
        output.content[entry.name] = r;
      }
    }),
  );

  return output;
};

export const getFileContent = async (filePath: string): Promise<ISavedFile> => {
  const ex = await exists(filePath);
  if (!ex) {
    throw new Error('No such file');
  }

  const result = await makeBookFile(filePath, await path.basename(filePath));
  return result;
};

export const loadFilesFromFolder = async ({
  basePath,
  recursive,
}: {
  basePath: string;
  recursive?: boolean;
}): Promise<IFiles> => {
  const ex = await exists(basePath);
  if (!ex) {
    throw new Error('Directory does not exist');
  }

  const files = await readDir(basePath);

  const result: IFiles = {};

  await Promise.all(
    files.map(async (entry) => {
      const fullPath = await path.join(basePath, entry.name);
      if (DOTFILE_REGEX.test(entry.name)) return;

      if (entry.isDirectory) {
        if (recursive) {
          const moreFiles = await loadFilesFromFolder({ basePath: fullPath, recursive });
          Object.entries(moreFiles).forEach(async ([path, content]) => {
            result[path] = content;
          });
        }
      } else {
        if ((await path.extname(entry.name)) === 'md') {
          const fileContent = await getFileContent(fullPath);
          result[fullPath] = fileContent;
        } else {
        }
      }
    }),
  );

  return result;
};

export const loadFilesFromTag = async (tag: string): Promise<IFiles> => {
  return {};
};

export const saveFileContent = async (
  file: ISavedFile,
  dontBlockWatcher?: boolean,
): Promise<void> => {
  if (!dontBlockWatcher) {
    FileUpdates.ignored[file.path] = add(new Date(), { seconds: 3 });
  }
  const encoded = makeEncodedBook(file);
  await writeTextFile(file.path, encoded);
};

export const saveNewFile = async ({
  basePath,
  file,
}: {
  basePath: string;
  file: IUnsavedFile;
}): Promise<ISavedFile> => {
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

  while (exists(await path.join(basePath, newName))) {
    newName = `${newName} (${uniquenessNumber})`;
    uniquenessNumber++;
  }

  const fileToSave = {
    ...file,
    unsaved: false,
    name: newName,
    path: await path.join(basePath, newName),
  };

  await saveFileContent(fileToSave);

  return fileToSave;
};

export const saveNewFiles = async ({
  basePath,
  files,
}: {
  basePath: string;
  files: IUnsavedFile[];
}): Promise<void> => {
  await Promise.all(files.map((file) => saveNewFile({ basePath, file })));
};

export const moveToFolder = async (moveItemPath: string, toFolderPath: string): Promise<string> => {
  const target = await path.join(toFolderPath, await path.basename(moveItemPath));
  if (target === moveItemPath) return moveItemPath;
  await rename(moveItemPath, target);
  return target;
};

export const renameEntity = async ({ srcPath, newName }: { srcPath: string; newName: string }) => {
  const onlyDir = await path.dirname(srcPath);
  const targetPath = await path.join(onlyDir, newName);
  await rename(srcPath, targetPath);
  return targetPath;
};

export const remove = async (delPath: string): Promise<void> => {
  await remove(delPath);
};

export const locateCover = async (filename: string) => {
  const root = rootPathFromStore();
  const localSettings = await getSettings();
  return await path.join(root, localSettings.coversPath, filename);
};

export const removeCover = async ({ bookFilePath }: { bookFilePath: string }): Promise<void> => {
  const book = await getFileContent(bookFilePath);
  if (!book.cover) throw 'Trying to delete cover from book without one';
  const coverPath = await locateCover(book.cover);
  await remove(coverPath);
  delete book.cover;
  await saveFileContent(book);

  showNotification({
    title: 'Deleted',
    text: 'Cover removed and deleted from disk',
  });
};

// Takes filename for cover we want to save and returns path to save it.
// Can accept both "filename.ext" and "/folder/filename.ext"
export const getPathForCoverSaving = async (coverFile: string) => {
  const localSettings = await getSettings();
  const root = rootPathFromStore();

  const totalPath = await path.join(root, localSettings.coversPath);

  if (!(await exists(totalPath))) {
    await createFolder({ pathForFolder: root, name: localSettings.coversPath });
  }

  const ext = await path.extname(coverFile);
  let coverFileName = (await path.basename(coverFile)).replace(ext, '');

  while (await exists(await path.join(root, localSettings.coversPath, coverFileName + ext))) {
    coverFileName += '(1)';
  }

  return path.join(root, localSettings.coversPath, coverFileName + ext);
};

export const setCover = async ({ bookFilePath }: { bookFilePath: string }) => {
  const root = rootPathFromStore();
  const book = await getFileContent(bookFilePath);
  const file = await open({
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
  });

  if (file) {
    const filename = await path.basename(file);

    const pathToSave = await getPathForCoverSaving(filename);

    await copyFile(file, await path.join(root, pathToSave));

    book.cover = await path.basename(pathToSave);
    saveFileContent(book);
  }
};

export const createFolder = async ({
  pathForFolder,
  name,
}: {
  pathForFolder: string;
  name: string;
}) => {
  const newPath = await path.join(pathForFolder, name);
  await mkdir(newPath);
  return newPath;
};

export const saveCoverFromBlob = async (fileNameWithExtension: string, imageBlob: Blob) => {
  const path = await getPathForCoverSaving(fileNameWithExtension);

  await writeFile(path, Buffer.from(await imageBlob.arrayBuffer()));
  return path;
};

export const fetchCover = async ({ bookFilePath }: { bookFilePath: string }) => {
  const book = await getFileContent(bookFilePath);
  if (!book.isbn13 || (String(book.isbn13).length !== 13 && String(book.isbn13).length !== 10)) {
    showNotification({
      title: 'Unable to fetch',
      text: 'ISBN is incorrect. It should be 10 or 13 numbers.',
    });
    return;
  }

  showNotification({
    title: 'Trying to fetch cover',
    text: 'Please wait',
  });

  const res = await fetch(`https://covers.openlibrary.org/b/ISBN/${book.isbn13}-L.jpg`);

  if (res.status !== 200) {
    showNotification({
      title: 'Unable to fetch',
      text: 'OpenLibrary has no cover awailable for this ISBN',
    });
    return;
  }

  const cover = await res.blob();

  // Sometimes API returns empty 1px by 1px image. Treat this as if we got 404
  if (cover.size / 1000 < 5) {
    showNotification({
      title: 'Unable to fetch',
      text: 'OpenLibrary has no cover awailable for this ISBN',
    });
    return;
  }

  const savedCoverPath = await saveCoverFromBlob(String(book.isbn13), cover);
  book.cover = await path.basename(savedCoverPath);
  saveFileContent(book);

  showNotification({
    title: 'Got cover',
    text: 'OpenLibrary found cover for this ISBN, added it.',
  });
};
