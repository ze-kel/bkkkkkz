import * as path from 'path';
import * as fs from 'fs-extra';

import type { ElectronApplication } from 'playwright';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { setupTest, afterTest, sleep, getLocators, LOAD_TIMEOUT } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '5. Initial Setup');
const basePath = path.join(process.cwd(), 'tests', 'initialsetup');
const workingPath = path.join(basePath, 'files');
const userPath = path.join(basePath, 'userData');

beforeAll(async () => {
  fs.ensureDirSync(userPath);
  fs.ensureDirSync(workingPath);
  electronApp = await setupTest({
    originalPath,
    FORCE_USER_PATH: userPath,
    FAKE_SET_ROOT_DIR: workingPath,
  });
});

afterAll(async () => await afterTest(electronApp, basePath));

test('Test initial setup', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);
  const initialSetButton = page.getByRole('button', { name: 'Set Working Directory' });
  await expect(
    initialSetButton.isVisible(),
    'Initial Set Working Directory button visible',
  ).toBeTruthy();

  // This will open native file dialog, which cant be controlled by playwright, so we take it from env variable
  initialSetButton.click();

  await sleep(LOAD_TIMEOUT);

  expect(await L.openedTab.count(), 'Initially we have no tabs opened').toBe(0);

  const viewAll = page.getByRole('button', {
    name: 'View All Books',
  });

  viewAll.click();

  expect(await L.openedTab.count(), 'After View All Books click, we have one tabs').toBe(0);

  expect(await L.bookItems.count(), 'We dont have any books yet').toBe(0);

  const addDemoButtons = page.getByRole('button', {
    name: 'Add Demo Books',
  });

  await expect(initialSetButton.isVisible(), 'Add Demo Books button visible').toBeTruthy();
  addDemoButtons.click();

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'Demo books added').toBe(3);
});
