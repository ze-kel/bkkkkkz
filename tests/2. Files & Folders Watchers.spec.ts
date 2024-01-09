import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import { setupTest, afterTest, getLocators } from './helpers';
import { testClasses } from '../packages/renderer/src/utils/testClassBinds';

let electronApp: ElectronApplication;
let workingPath: string;
let booksPath: string;
let resetFolder: () => void = () => {};

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '1. Basic');

test.beforeAll(async () => {
  ({ electronApp, workingPath, booksPath, resetFolder } = await setupTest({ originalPath }));
});

test.afterAll(async () => await afterTest(electronApp, workingPath));

test('File tree watcher', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await expect(L.fileTreeItems, 'Number of folders seen is correct').toHaveCount(3);

  const folderOneName = await L.fileTreeItems.nth(1).locator('.' + testClasses.label);
  const folderTwoName = await L.fileTreeItems.nth(2).locator('.' + testClasses.label);
  await expect(folderOneName, 'Folder 1 name is shown correctly').toContainText('1wbkk');
  await expect(folderTwoName, 'Folder 2 name is shown correctly').toContainText('2empt');

  fs.moveSync(path.join(booksPath, '1wbkk'), path.join(booksPath, '1renm'));

  await expect(folderOneName, 'Renaming folder on disk is reflected in interface').toContainText(
    '1renm',
  );

  fs.removeSync(path.join(booksPath, '2empt'));

  await expect(L.fileTreeItems, 'Removing folder is reflected in interface').toHaveCount(2);

  await Promise.all([
    fs.copy(path.join(booksPath, '1renm'), path.join(booksPath, '1renm2')),
    fs.copy(path.join(booksPath, '1renm'), path.join(booksPath, '1renm3')),
    fs.copy(path.join(booksPath, '1renm'), path.join(booksPath, '1renm4')),
  ]);

  await expect(L.fileTreeItems, 'Adding folders is reflected in interface').toHaveCount(5);
});

test('Folder watcher', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  resetFolder();
  //wait for reset to appear
  await expect(L.fileTreeItems).toContainText(['1wbkk']);
  await L.fileTreeItems.nth(1).click();

  await expect(
    L.openedTab,
    'After clicking first folder, a tab opened with right label',
  ).toContainText('1wbkk');

  await expect(L.bookItems, 'We see one book in the first folder').toHaveCount(1);

  await Promise.all([
    fs.copyFile(path.join(booksPath, '48.md'), path.join(booksPath, '1wbkk', '48-2.md')),
    fs.copyFile(path.join(booksPath, 'med.md'), path.join(booksPath, '1wbkk', 'med-2.md')),
  ]);

  await expect(L.bookItems, 'Adding books is reflected in interface').toHaveCount(3);

  await fs.remove(path.join(booksPath, '1wbkk', '48-2.md'));

  await expect(L.bookItems, 'Adding books is reflected in interface').toHaveCount(2);

  //
  // We test "All books" page separately because it's "recursive" by default and parses all sub-directories
  //
  await L.fileTreeItems.first().click();
  await expect(
    await L.openedTab.first().locator('.' + testClasses.label),
    'After clicking all books, a tab opened with right label',
  ).toContainText('All Books');

  await expect(L.bookItems, 'All books shows correct number of books').toHaveCount(4);

  fs.moveSync(path.join(booksPath, '48.md'), path.join(booksPath, '1wbkk', '48-3.md'));
  fs.removeSync(path.join(booksPath, '1wbkk', 'mm.md'));

  await expect(
    L.bookItems,
    'All books page watcher handles operating in sub-directory correctly',
  ).toHaveCount(3);
});
