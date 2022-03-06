/* eslint-disable quotes */
import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { _electron as electron } from 'playwright';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { getFileTreeMenu } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), '/tests/testfiles_original/');
const workingPath = path.join(process.cwd(), '/tests/testfiles/');

beforeAll(async () => {
  fs.copySync(originalPath, workingPath);

  electronApp = await electron.launch({
    env: {
      FORCE_ROOT_PATH: workingPath,
      TEST_MODE: 'true',
    },
    args: ['.'],
  });
});

afterAll(async () => {
  await electronApp.close();
  fs.removeSync(workingPath);
});

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

test('Main window state', async () => {
  const windowState: { isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean } =
    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];

      const getState = () => ({
        isVisible: mainWindow.isVisible(),
        isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
        isCrashed: mainWindow.webContents.isCrashed(),
      });

      return new Promise((resolve) => {
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
      });
    });

  expect(windowState.isCrashed, 'App was crashed').toBeFalsy();
  expect(windowState.isVisible, 'Main window was not visible').toBeTruthy();
  expect(windowState.isDevToolsOpened, 'DevTools was opened').toBeFalsy();
});

test('Main window state', async () => {
  const windowState: { isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean } =
    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];

      const getState = () => ({
        isVisible: mainWindow.isVisible(),
        isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
        isCrashed: mainWindow.webContents.isCrashed(),
      });

      return new Promise((resolve) => {
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
      });
    });

  expect(windowState.isCrashed, 'App was crashed').toBeFalsy();
  expect(windowState.isVisible, 'Main window was not visible').toBeTruthy();
  expect(windowState.isDevToolsOpened, 'DevTools was opened').toBeFalsy();
});

test('Can open All Books page', async () => {
  const page = await electronApp.firstWindow();
  const appElement = await page.$('#app', { strict: true });
  expect(appElement, "Can't find root element").toBeDefined();
  if (!appElement) return;

  const menuItems = await getFileTreeMenu(appElement);
  expect(menuItems[0].label).toBe('All Books');

  await menuItems[0].element.click();
});
