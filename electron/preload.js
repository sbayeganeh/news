const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getNews: (genres) => ipcRenderer.invoke('get-news', genres),
  getModelStatus: () => ipcRenderer.invoke('get-model-status'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Listen for events from main process
  onModelStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('model-status', handler);
    return () => ipcRenderer.removeListener('model-status', handler);
  },
  onForceRefresh: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('force-refresh', handler);
    return () => ipcRenderer.removeListener('force-refresh', handler);
  },
});
