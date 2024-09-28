import * as path from 'path';

import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import { setupTest, afterTest, getLocators, testFolderBase } from './helpers';

let electronApp: ElectronApplication;
let workingPath: string;

const originalPath = path.join(testFolderBase, 'testfiles_packs', '5. Initial Setup', 'first');

test.beforeAll(async () => {
  ({ electronApp, workingPath } = await setupTest({
    originalPath,
    noRootPath: true,
  }));
});

test.afterAll(async () => await afterTest(electronApp, workingPath));

test('Test initial setup', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);
  const initialSetButton = page.getByRole('button', { name: 'Set Working Directory' });
  await expect(initialSetButton, 'Initial Set Working Directory button visible').toBeVisible();

  // This will open native file dialog, which cant be controlled by playwright, so we take it from env variable
  initialSetButton.click();

  expect(await L.openedTab.count(), 'Initially we have no tabs opened').toBe(0);

  const viewAll = page.getByRole('button', {
    name: 'View All Books',
  });

  viewAll.click();

  await expect(L.openedTab, 'After View All Books click, we have one tab').toHaveCount(1);

  await expect(L.bookItems, 'We dont have any books yet').toHaveCount(0);

  const addDemoButtons = page.getByRole('button', {
    name: 'Add Demo Books',
  });

  await expect(addDemoButtons, 'Add Demo Books button visible').toBeVisible();
  addDemoButtons.click();

  await expect(L.bookItems, 'Demo books added').toHaveCount(3);
});
