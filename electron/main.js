const { app, BrowserWindow, Tray, Menu, ipcMain, shell, screen, nativeImage } = require('electron');
const path = require('path');
const { initStore, getStore } = require('./store.js');

let mainWindow = null;
let tray = null;
let newsAggregator = null;

const isDev = !app.isPackaged;

function createWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: screenWidth,
    height: 60,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple 16x16 tray icon
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkoBAwUqifYdAb8P9/A0Mi' +
      'IwMDgyIDA8NERgYGBUIMMMIKkNMMDQwwA4gxAF0/ugHEGICuH8WAUQMGPAwAAADqFhARsOSBAAAAAElF' +
      'TkSuQmCC',
      'base64'
    )
  );

  tray = new Tray(icon);
  tray.setToolTip('News Ticker');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => mainWindow && mainWindow.show(),
    },
    {
      label: 'Hide',
      click: () => mainWindow && mainWindow.hide(),
    },
    { type: 'separator' },
    {
      label: 'Refresh News',
      click: () => mainWindow && mainWindow.webContents.send('force-refresh'),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

async function initServices() {
  // Dynamic import for ESM modules
  const { NewsAggregator } = await import('./services/newsAggregator.mjs');
  newsAggregator = new NewsAggregator();

  // Send model status updates to renderer
  newsAggregator.on('model-status', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.webContents.send('model-status', status);
      } catch {
        // Window may have been destroyed during send
      }
    }
  });

  await newsAggregator.init();
}

function setupIPC() {
  ipcMain.handle('get-news', async (_event, genres) => {
    if (!newsAggregator) {
      return { error: 'Services not initialized yet' };
    }
    try {
      const headlines = await newsAggregator.fetchAllNews(genres);
      return { headlines };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('get-model-status', () => {
    if (!newsAggregator) {
      return { status: 'initializing', progress: 0 };
    }
    return newsAggregator.getModelStatus();
  });

  ipcMain.handle('get-settings', () => {
    const store = getStore();
    return {
      enabledGenres: store.get('enabledGenres'),
      refreshInterval: store.get('refreshInterval'),
    };
  });

  ipcMain.handle('save-settings', (_event, settings) => {
    const store = getStore();
    if (settings.enabledGenres) store.set('enabledGenres', settings.enabledGenres);
    if (settings.refreshInterval) store.set('refreshInterval', settings.refreshInterval);
    return true;
  });

  ipcMain.handle('open-external', (_event, url) => {
    // Validate URL before opening
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch {
      // Invalid URL, ignore
    }
  });
}

app.whenReady().then(async () => {
  await initStore();
  createWindow();
  createTray();
  setupIPC();

  // Init services asynchronously — don't block window creation
  initServices().catch((err) => {
    console.error('Failed to initialize services:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.webContents.send('model-status', {
          status: 'error',
          message: err.message,
        });
      } catch {
        // Window may have been destroyed
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
