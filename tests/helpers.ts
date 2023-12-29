import * as fs from 'fs-extra';
import type { ElectronApplication, Locator, Page } from 'playwright';
import { _electron as electron } from 'playwright';
import { testClasses } from '../packages/renderer/src/utils/testClassBinds';
import { expect } from 'playwright/test';

export const setupTest = async ({
  originalPath,
  FORCE_ROOT_PATH,
  FORCE_USER_PATH,
  FAKE_SET_ROOT_DIR,
}: {
  originalPath: string;
  FORCE_ROOT_PATH?: string;
  FORCE_USER_PATH?: string;
  FAKE_SET_ROOT_DIR?: string;
}) => {
  const env: Record<string, string> = {};

  if (FORCE_ROOT_PATH) {
    env.FORCE_ROOT_PATH = FORCE_ROOT_PATH;
    fs.removeSync(FORCE_ROOT_PATH);
    fs.copySync(originalPath, FORCE_ROOT_PATH);
  }

  if (FORCE_USER_PATH) {
    env.FORCE_USER_PATH = FORCE_USER_PATH;
  }
  if (FAKE_SET_ROOT_DIR) {
    env.FAKE_SET_ROOT_DIR = FAKE_SET_ROOT_DIR;
  }

  const electronApp = await electron.launch({
    env: {
      ...env,
      TEST_MODE: 'true',
      NODE_ENV: 'development',
    },
    args: ['.'],
  });

  return electronApp;
};

export const afterTest = async (electronApp: ElectronApplication, workingPath: string) => {
  await sleep(LOAD_TIMEOUT);
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
