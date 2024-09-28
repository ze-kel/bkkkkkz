import * as path from 'path';

import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import { setupTest, afterTest, getLocators, testFolderBase } from './helpers';

let electronApp: ElectronApplication;
let workingPath: string;

const originalPath = path.join(testFolderBase, 'testfiles_packs', '6. Root Switch', 'first');
const originalPath2 = path.join(testFolderBase, 'testfiles_packs', '6. Root Switch', 'second');

test.beforeAll(async () => {
  ({ electronApp, workingPath } = await setupTest({
    originalPath,
    originalPath2,
  }));
});

test.afterAll(async () => await afterTest(electronApp, workingPath));

test('Switching root paths works correctly', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.fileTreeItems.first().click();

  await expect(L.bookItems, 'Initial book count correct').toHaveCount(2);
  await expect(L.bookItems, 'Initial book names correct').toContainText([
    'American Psycho',
    'Crime and Punishment',
  ]);

  await expect(L.tagTreeItem, 'Initial tags count correct').toHaveCount(3);
  await expect(L.tagTreeItem, 'Initial tags correct').toContainText([
    'atagOneOne',
    'btagOneTwo',
    'ctagOneThree',
  ]);

  await L.menuSettings.click();

  await L.settingsChangeRootPath.click();

  await L.modalClose.click();

  await L.fileTreeItems.first().click();

  await expect(L.bookItems, 'Updated book count correct').toHaveCount(1);
  await expect(L.bookItems, 'Updated book names correct').toContainText(['Twilight']);

  await expect(L.tagTreeItem, 'Updated tags count correct').toHaveCount(2);
  await expect(L.tagTreeItem, 'Updated tags correct').toContainText(['atagTwoOne', 'btagTwoTwo']);
});
