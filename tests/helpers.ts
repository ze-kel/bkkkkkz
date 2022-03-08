import * as fs from 'fs-extra';
import type { ElectronApplication, Page } from 'playwright';
import { _electron as electron } from 'playwright';

export const setupTest = async (originalPath: string, workingPath: string) => {
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
    bookItems: page.locator('.T-book-item'),
    openedTab: page.locator('.T-view-tab-opened'),
    editorTitle: page.locator('.T-editor-title'),
    editorAuthor: page.locator('.T-editor-author'),
    editorYear: page.locator('.T-editor-year'),
    editorIsbn: page.locator('.T-editor-isbn'),
    editorFilename: page.locator('.T-editor-filename'),
    editorMarkdown: page.locator('.T-editor-markdown'),
  };
};
