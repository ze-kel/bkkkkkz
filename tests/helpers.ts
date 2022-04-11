import * as fs from 'fs-extra';
import type { ElectronApplication, Locator, Page } from 'playwright';
import { _electron as electron } from 'playwright';

export const setupTest = async (originalPath: string, workingPath: string) => {
  fs.removeSync(workingPath);
  fs.copySync(originalPath, workingPath);

  const electronApp = await electron.launch({
    env: {
      FORCE_ROOT_PATH: workingPath,
      TEST_MODE: 'true',
    },
    args: ['.'],
  });

  await sleep(LOAD_TIMEOUT);
  return electronApp;
};

export const afterTest = async (electronApp: ElectronApplication, workingPath: string) => {
  await sleep(LOAD_TIMEOUT);
  await electronApp.close();
  fs.removeSync(workingPath);
};

// This can be way less most of the time, but in a few rare cases you need 1000 to be bulletproof.
export const LOAD_TIMEOUT = 1000;

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const getLocators = (page: Page) => {
  return {
    fileTreeItems: page.locator('.T-file-tree-item'),
    tagTreeItem: page.locator('.T-tag-tree-item'),
    bookItems: page.locator('.T-book-item'),
    openedTab: page.locator('.T-view-tab-opened'),
    editorTitle: page.locator('.T-editor-title'),
    editorAuthor: page.locator('.T-editor-author'),
    editorYear: page.locator('.T-editor-year'),
    editorIsbn: page.locator('.T-editor-isbn'),
    editorFilename: page.locator('.T-editor-filename'),
    editorMarkdown: page.locator('.T-editor-markdown'),
    editorTag: page.locator('.T-editor-tag'),
    editorAddTag: page.locator('.T-editor-add-tag'),
    editorStar: page.locator('.T-editor-star'),
    editorStarFilled: page.locator('.T-editor-star-filled'),
    editorStarHalf: page.locator('.T-editor-star-half'),
    editorStarEmpty: page.locator('.T-editor-star-empty'),
    editorDateFrom: page.locator('.T-editor-date-from'),
    editorDateTo: page.locator('.T-editor-date-to'),
    editorDateAdd: page.locator('.T-editor-date-add'),
    editorDateRemove: page.locator('.T-editor-date-remove'),
  };
};

type TestBookDate = { from: string; to: string };

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
  const author = await L.editorAuthor.innerText();
  const title = await L.editorTitle.innerText();
  const year = await L.editorYear.innerText();
  const ISBN = await L.editorIsbn.innerText();

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
    dates[i]['from'] = await field.inputValue();
  }
  for (let i = 0; i < numberToDates; i++) {
    if (!dates[i]) dates[i] = { from: '', to: '' };
    const field = await L.editorDateTo.nth(i);
    dates[i]['to'] = await field.inputValue();
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
