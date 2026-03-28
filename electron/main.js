const { app, BrowserWindow, Tray, Menu, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const { initStore, getStore } = require('./store.js');

let mainWindow = null;
let tray = null;
let newsAggregator = null;

const isDev = !app.isPackaged;

let expectedHeight = 60;

function createWindow() {
  const { screen } = require('electron');
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
    resizable: true,
    hasShadow: false,
    maximizable: false,
    minimizable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Intercept all resize attempts — only allow horizontal changes
  mainWindow.on('will-resize', (event, newBounds) => {
    event.preventDefault();
    mainWindow.setBounds({
      x: newBounds.x,
      y: newBounds.y,
      width: Math.max(300, newBounds.width),
      height: expectedHeight,
    });
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple 16x16 tray icon
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

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
  const { NewsAggregator } = await import('./services/newsAggregator.mjs');
  newsAggregator = new NewsAggregator();
}

function setupIPC() {
  ipcMain.handle('resize-window', (_event, { height }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      expectedHeight = height;
      const [width] = mainWindow.getSize();
      mainWindow.setSize(width, height, true);
    }
  });

  ipcMain.handle('get-window-bounds', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [width, height] = mainWindow.getSize();
      const [x, y] = mainWindow.getPosition();
      return { width, height, x, y };
    }
    return { width: 800, height: 60, x: 0, y: 0 };
  });

  ipcMain.handle('resize-window-width', (_event, { width }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [, height] = mainWindow.getSize();
      mainWindow.setSize(Math.max(300, width), height, true);
    }
  });

  ipcMain.handle('move-window', (_event, { deltaX, deltaY }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x + deltaX, y + deltaY);
    }
  });

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

  ipcMain.handle('close-app', () => {
    app.quit();
  });
}

app.whenReady().then(async () => {
  await initStore();
  createWindow();
  createTray();
  setupIPC();

  initServices().catch((err) => {
    console.error('Failed to initialize services:', err);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (app.isReady() && mainWindow === null) createWindow();
});
