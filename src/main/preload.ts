import { contextBridge, ipcRenderer, IpcRendererEvent, app } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      /* ... */
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      /* ... */
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      /* ... */
    },
  },
  saveReport: async (reportData, filePath: string | null | undefined = null) =>
    await ipcRenderer.invoke('save-report-dialog', { reportData, filePath }),
  loadReport: async () => await ipcRenderer.invoke('load-report-dialog'),
  buildPathDialog: async (defaultPath) =>
    await ipcRenderer.invoke('build-path-dialog', defaultPath),
  directoryDialog: async (defaultPath: string, isRoot: boolean = false) =>
    await ipcRenderer.invoke('directory-dialog', {
      currentDirectory: defaultPath,
      isRoot,
    }),
  getVersion: async () => await ipcRenderer.invoke('get-version'),
  getRelativePath: async (paths: { from: string; to: string }) =>
    await ipcRenderer.invoke('get-relative-path', paths),
  resolvePath: async (paths: { base: string; relative: string }) =>
    await ipcRenderer.invoke('resolve-path', paths),
  openFile: async (filePath: string) =>
    await ipcRenderer.invoke('open-file', filePath),

  Notification: Notification,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
