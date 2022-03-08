import * as path from 'path';
import type { ElectronApplication } from 'playwright';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { setupTest, afterTest, sleep, getLocators, LOAD_TIMEOUT } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '1. Basic');
const workingPath = path.join(process.cwd(), 'tests', 'core');

beforeEach(async () => {
  electronApp = await setupTest(originalPath, workingPath);
});

afterEach(async () => await afterTest(electronApp, workingPath));

test('App loads and vue mounts correctly', async () => {
  const page = await electronApp.firstWindow();
  const appLocator = await page.locator('#app');
  expect(await appLocator.count(), 'Cant find root element').toBe(1);
});

test('Files are seen', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);
  expect(await L.fileTreeItems.count(), 'Number of folders seen is correct').toBe(3);

  await L.fileTreeItems.first().click();
  await sleep(LOAD_TIMEOUT);
  expect(await L.openedTab.count(), 'After clicking All Books we have an open tab').toBe(1);
  expect(await L.bookItems.count(), 'Number of books we see in all books is correct(3)').toBe(3);

  await L.fileTreeItems.nth(1).click();
  await sleep(LOAD_TIMEOUT);
  expect(await L.bookItems.count(), 'Number of books we see in first folder is correct(1)').toBe(1);
});
