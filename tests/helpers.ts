import * as fs from 'fs-extra';
import type { ElectronApplication, Locator, Page } from 'playwright';
import { _electron as electron } from 'playwright';
import { testClasses } from '../packages/renderer/src/utils/testClassBinds';

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

  await sleep(LOAD_TIMEOUT);
  return electronApp;
};

export const afterTest = async (electronApp: ElectronApplication, workingPath: string) => {
  await sleep(LOAD_TIMEOUT);
  console.log('closing');
  await electronApp.close();
  console.log('removing working path');
  fs.removeSync(workingPath);
};

// Main editor save is debounced at 300ms, 500 should be enough for modern computers
export const LOAD_TIMEOUT = 1000;

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const getLocators = (page: Page) => {
  const locators: Record<string, Locator> = {};

  Object.entries(testClasses).forEach((el) => {
    locators[el[0]] = page.locator('.' + el[1]);
  });

  return locators as Record<keyof typeof testClasses, Locator>;
};

type TestBookDate = { from: string | null; to: string | null };

export type TestBookFromEditor = {
  author: string;
  title: string;
  year: string;
  ISBN: string;
  tags: string[];
  dates: TestBookDate[];
  rating: number;
};

export const getBookFromEditor = async (
  L: Record<string, Locator>,
): Promise<TestBookFromEditor> => {
  const author = await L.editorAuthor.inputValue();
  const title = await L.editorTitle.inputValue();
  const year = await L.editorYear.inputValue();
  const ISBN = await L.editorIsbn.inputValue();

  const numberOfTags = await L.editorTag.count();
  const tags = [];
  for (let i = 0; i < numberOfTags; i++) {
    tags.push(await L.editorTag.nth(i).innerText());
  }

  const dates: TestBookDate[] = [];
  const numberFromDates = await L.editorDateFrom.count();
  const numberToDates = await L.editorDateTo.count();

  for (let i = 0; i < numberFromDates; i++) {
    if (!dates[i]) dates[i] = { from: '', to: '' };
    const field = await L.editorDateFrom.nth(i);
    const content = await field.textContent();
    if (content !== null) {
      dates[i]['from'] = content.trim();
    }
  }
  for (let i = 0; i < numberToDates; i++) {
    if (!dates[i]) dates[i] = { from: '', to: '' };
    const field = await L.editorDateTo.nth(i);

    const content = await field.textContent();
    if (content !== null) {
      dates[i]['to'] = content.trim();
    }
  }

  const filledStars = await L.editorStarFilled.count();
  const halfStars = await L.editorStarHalf.count();

  const rating = filledStars + halfStars * 0.5;

  return { author, title, year, ISBN, tags, dates, rating };
};

export const removeLineTerminators = (string: string) => {
  // We need this to compare files as strings and not worry about different line terminators on different OS-es
  return string.replace(/\n|\r/g, '');
};
