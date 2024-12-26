import { contextBridge, ipcRenderer, IpcRendererEvent, app } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  path: {
    normalize: (filepath: string) => ipcRenderer.invoke('path-normalize', filepath),
    join: (...args: string[]) => ipcRenderer.invoke('path-join', ...args),
    relative: (from: string, to: string) =>
      ipcRenderer.invoke('path-relative', from, to),
  },
  saveReport: (reportData) => ipcRenderer.invoke('save-report-dialog', reportData),
  loadReport: () => ipcRenderer.invoke('load-report-dialog'),
  buildPathDialog: (defaultPath) =>
    ipcRenderer.invoke('build-path-dialog', defaultPath),
  directoryDialog: (defaultPath) =>
    ipcRenderer.invoke('directory-dialog', defaultPath),
  getVersion: () => ipcRenderer.invoke('get-version'),
  Notification,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
