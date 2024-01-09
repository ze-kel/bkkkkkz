import * as fs from 'fs-extra';
import type { ElectronApplication, Locator, Page } from 'playwright';
import { _electron as electron } from 'playwright';
import { testClasses } from '../packages/renderer/src/utils/testClassBinds';
import { expect } from 'playwright/test';
import ShortUniqueId from 'short-unique-id';
import * as path from 'node:path';

const workDir = path.join(process.cwd(), 'tests', 'working');

const uid = new ShortUniqueId({ length: 10 });

export const setupTest = async ({
  originalPath,
  originalPath2,
  noRootPath,
}: {
  originalPath: string;
  originalPath2?: string;
  noRootPath?: boolean;
}) => {
  const workingPath = path.join(workDir, uid.randomUUID());

  const filesFolder = path.join(workingPath, 'files');
  const filesFolder2 = path.join(workingPath, 'files2');
  const userFolder = path.join(workingPath, 'user');
  fs.ensureDirSync(userFolder);

  fs.ensureDirSync(filesFolder);
  fs.ensureDirSync(filesFolder2);
  fs.copySync(originalPath, filesFolder);

  if (originalPath2) {
    fs.copySync(originalPath2, filesFolder2);
  }

  const resetFolder = () => {
    fs.rmSync(filesFolder, { recursive: true, force: true });
    fs.rmSync(filesFolder2, { recursive: true, force: true });
    fs.ensureDirSync(filesFolder);
    fs.ensureDirSync(filesFolder2);
    fs.copySync(originalPath, filesFolder);
  };

  if (!noRootPath) {
    fs.writeFileSync(path.join(userFolder, 'path.json'), JSON.stringify({ path: filesFolder }));
  }

  const electronApp = await electron.launch({
    env: {
      TEST_MODE: 'true',
      NODE_ENV: 'development',
      FORCE_USER_PATH: userFolder,
      FAKE_SET_ROOT_DIR: noRootPath ? filesFolder : filesFolder2,
    },
    args: ['.'],
  });

  return { electronApp, workingPath, booksPath: filesFolder, resetFolder };
};

export const afterTest = async (electronApp: ElectronApplication, workingPath: string) => {
  await electronApp.close();
  fs.removeSync(workingPath);
};

// Main editor save is debounced at 300ms, 500 should be enough for modern computers
export const LOAD_TIMEOUT = 1000;

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

type ILocators = Record<keyof typeof testClasses, Locator>;

export const getLocators = (page: Page) => {
  const locators: Record<string, Locator> = {};

  Object.entries(testClasses).forEach((el) => {
    locators[el[0]] = page.locator('.' + el[1]);
  });

  return locators as ILocators;
};

type TestBookDate = { from: string | null; to: string | null };

export type ExpectedBook = {
  author: string;
  title: string;
  year: string;
  ISBN: string;
  tags: string[];
  dates: TestBookDate[];
  rating: number;
};

export const expectBookInEditor = async (
  L: ILocators,
  book: ExpectedBook,
  expectationPrefix = '',
): Promise<void> => {
  await expect(L.editorAuthor, expectationPrefix + 'author').toHaveValue(book.author);
  await expect(L.editorTitle, expectationPrefix + 'title').toHaveValue(book.title);
  await expect(L.editorYear, expectationPrefix + 'year').toHaveValue(book.year);
  await expect(L.editorIsbn, expectationPrefix + 'ISBN').toHaveValue(book.ISBN);
  await expect(L.editorTag).toContainText(book.tags);
  await expect(L.editorDateFrom).toContainText(
    book.dates.map((v) => v.from || '').filter((v) => v.length),
  );
  await expect(L.editorDateTo).toContainText(
    book.dates.map((v) => v.to || '').filter((v) => v.length),
  );
  await expect(L.editorStarFilled).toHaveCount(Math.floor(book.rating));
  await expect(L.editorStarHalf).toHaveCount(Math.floor(book.rating) !== book.rating ? 1 : 0);
};

export const removeLineTerminators = (string: string) => {
  // We need this to compare files as strings and not worry about different line terminators on different OS-es
  return string.replace(/\n|\r/g, '');
};
