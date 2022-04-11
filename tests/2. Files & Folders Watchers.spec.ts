import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { setupTest, afterTest, sleep, getLocators, LOAD_TIMEOUT } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '1. Basic');
const workingPath = path.join(process.cwd(), 'tests', 'ffwatchers');

beforeEach(async () => {
  electronApp = await setupTest(originalPath, workingPath);
});

afterEach(async () => await afterTest(electronApp, workingPath));

test('File tree watcher', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);
  
  await sleep(LOAD_TIMEOUT);
  expect(await L.fileTreeItems.count(), 'Number of folders seen is correct').toBe(3);

  const folderOneName = await L.fileTreeItems.nth(1).locator('.T-label');
  const folderTwoName = await L.fileTreeItems.nth(2).locator('.T-label');
  expect(await folderOneName.innerText(), 'Folder 1 name is shown correctly').toBe('1wbkk');
  expect(await folderTwoName.innerText(), 'Folder 2 name is shown correctly').toBe('2empt');

  fs.moveSync(path.join(workingPath, '1wbkk'), path.join(workingPath, '1renm'));
  await sleep(LOAD_TIMEOUT);
  expect(await folderOneName.innerText(), 'Renaming folder on disk is reflected in interface').toBe(
    '1renm',
  );

  fs.removeSync(path.join(workingPath, '2empt'));
  await sleep(LOAD_TIMEOUT);
  expect(await L.fileTreeItems.count(), 'Removing folder is reflected in interface').toBe(2);

  await Promise.all([
    fs.copy(path.join(workingPath, '1renm'), path.join(workingPath, '1renm2')),
    fs.copy(path.join(workingPath, '1renm'), path.join(workingPath, '1renm3')),
    fs.copy(path.join(workingPath, '1renm'), path.join(workingPath, '1renm4')),
  ]);

  await sleep(LOAD_TIMEOUT);
  expect(await L.fileTreeItems.count(), 'Adding folders is reflected in interface').toBe(5);
});

test('Folder watcher', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.fileTreeItems.nth(1).click();

  await sleep(LOAD_TIMEOUT);

  expect(
    await L.openedTab.first().locator('.T-label').innerText(),
    'After clicking first folder, a tab opened with right label',
  ).toBe('1wbkk');

  expect(await L.bookItems.count(), 'We see one book in the first folder').toBe(1);

  await Promise.all([
    fs.copyFile(path.join(workingPath, '48.md'), path.join(workingPath, '1wbkk', '48-2.md')),
    fs.copyFile(path.join(workingPath, 'med.md'), path.join(workingPath, '1wbkk', 'med-2.md')),
  ]);

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'Adding books is reflected in interface').toBe(3);

  await fs.remove(path.join(workingPath, '1wbkk', '48-2.md'));

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'Adding books is reflected in interface').toBe(2);

  //
  // We test "All books" page separately because it's "recursive" by default and parses all sub-directories
  //
  await L.fileTreeItems.first().click();
  expect(
    await L.openedTab.first().locator('.T-label').innerText(),
    'After clicking all books, a tab opened with right label',
  ).toBe('All Books');

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'All books shows correct number of books').toBe(4);

  fs.moveSync(path.join(workingPath, '48.md'), path.join(workingPath, '1wbkk', '48-3.md'));
  fs.removeSync(path.join(workingPath, '1wbkk', 'mm.md'));

  await sleep(LOAD_TIMEOUT);

  expect(
    await L.bookItems.count(),
    'All books page watcher handles operating in sub-directory correctly',
  ).toBe(3);
});
