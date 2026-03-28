const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNews: (genres) => ipcRenderer.invoke('get-news', genres),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  resizeWindow: (height) => ipcRenderer.invoke('resize-window', { height }),
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  resizeWindowWidth: (width) => ipcRenderer.invoke('resize-window-width', { width }),
  moveWindow: (deltaX, deltaY) => ipcRenderer.invoke('move-window', { deltaX, deltaY }),
  closeApp: () => ipcRenderer.invoke('close-app'),

  onForceRefresh: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('force-refresh', handler);
    return () => ipcRenderer.removeListener('force-refresh', handler);
  },
});
