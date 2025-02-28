import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  app,
  OpenDialogOptions,
} from 'electron';

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
  saveReport: async (
    reportData: any,
    filePath: string | null | undefined = null,
  ) => await ipcRenderer.invoke('save-report-dialog', { reportData, filePath }),
  loadReport: async () => await ipcRenderer.invoke('load-report-dialog'),
  buildPathDialog: async (defaultPath: string) =>
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
  confirmCloseApp: async (shouldClose: boolean) =>
    await ipcRenderer.invoke('confirm-close-app', shouldClose),
  onCloseRequested: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('app-close-requested', handler);
    return () => {
      ipcRenderer.removeListener('app-close-requested', handler);
    };
  },

  openFileDialog: async (options: OpenDialogOptions) =>
    await ipcRenderer.invoke('open-file-dialog', options),

  openDirectoryDialog: async (options: OpenDialogOptions) =>
    await ipcRenderer.invoke('open-directory-dialog', options),

  Notification: Notification,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
