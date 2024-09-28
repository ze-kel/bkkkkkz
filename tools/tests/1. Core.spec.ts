import * as path from 'path';
import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import { setupTest, afterTest, getLocators, testFolderBase } from './helpers';

let electronApp: ElectronApplication;
let workingPath: string;

const originalPath = path.join(testFolderBase, 'testfiles_packs', '1. Basic');

test.beforeAll(async () => {
  ({ electronApp, workingPath } = await setupTest({ originalPath }));
});

test.afterAll(async () => await afterTest(electronApp, workingPath));

test('App loads and vue mounts correctly', async () => {
  const page = await electronApp.firstWindow();
  const appLocator = await page.locator('#app');
  await expect(await appLocator.count(), 'Root el exists').toBe(1);
});

test('Files are seen', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);
  await expect(L.fileTreeItems, 'Number of folders seen is correct').toHaveCount(3);

  await L.fileTreeItems.first().click();
  await expect(L.openedTab, 'After clicking All Books we have an open tab').toHaveCount(1);
  await expect(L.bookItems, 'Number of books we see in all books is correct(3)').toHaveCount(3);

  await L.fileTreeItems.nth(1).click();
  await expect(L.bookItems, 'Number of books we see in first folder is correct(1)').toHaveCount(1);
});
