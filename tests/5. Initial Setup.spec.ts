import * as path from 'path';
import * as fs from 'fs-extra';

import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import { setupTest, afterTest, getLocators } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '5. Initial Setup');
const basePath = path.join(process.cwd(), 'tests', 'working', 'initialsetup');
const workingPath = path.join(basePath, 'files');
const userPath = path.join(basePath, 'userData');

test.beforeAll(async () => {
  fs.ensureDirSync(userPath);
  fs.ensureDirSync(workingPath);
  electronApp = await setupTest({
    originalPath,
    FORCE_USER_PATH: userPath,
    FAKE_SET_ROOT_DIR: workingPath,
  });
});

test.afterAll(async () => await afterTest(electronApp, basePath));

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
