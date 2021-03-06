import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import { join } from 'path';
import { URL } from 'url';

import initHandles from './ipc/ipcHandles';
import WebContentsProxy from './ipc/webContents';
import Files from './services/files';

const isTestMode = process.env['TEST_MODE'] === 'true';
const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance && !isTestMode) {
  app.quit();
  process.exit(0);
}

// Install "Vue.js devtools"
if (import.meta.env.MODE === 'development') {
  app
    .whenReady()
    .then(() => import('electron-devtools-installer'))
    .then(({ default: installExtension, VUEJS3_DEVTOOLS }) =>
      installExtension(VUEJS3_DEVTOOLS, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      }),
    )
    .catch((e) => console.error('Failed install extension:', e));
}

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false, // Use 'ready-to-show' event to show window
    webPreferences: {
      nativeWindowOpen: true,
      preload: join(__dirname, '../../preload/dist/index.cjs'),
    },
    width: 1280,
    height: 720,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 8 },
  });

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();

    /* This will open devtool when you open the app. TODO: make it a .env variable
     */
    if (import.meta.env.MODE === 'development') {
      mainWindow?.webContents.openDevTools();
    }
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  const pageUrl =
    import.meta.env.MODE === 'development' && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL('../renderer/dist/index.html', 'file://' + __dirname).toString();

  await mainWindow.loadURL(pageUrl);
};

app.on('second-instance', () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app
  .whenReady()
  .then(createWindow)
  .catch((e) => console.error('Failed create window:', e));

app.whenReady().then(() => {
  if (!mainWindow) {
    throw 'No main window, but app is ready, something is really wrong';
  }
  protocol.registerFileProtocol('covers', async (request, callback) => {
    const coverPath = request.url.replace('covers://', '');

    const fullPath = Files.locateCover(coverPath);
    return callback(fullPath);
  });

  WebContentsProxy.setWindow(mainWindow);
  initHandles(ipcMain);
});

// Auto-updates
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import('electron-updater'))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => console.error('Failed check updates:', e));
}

export default mainWindow;
