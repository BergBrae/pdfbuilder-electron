import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process'; // Import exec from child_process
import checkForUpdates from './checkForUpdates'; // Import the update check function

// Start backend code
const controller = new AbortController();
const signal = controller.signal;

// Get platform-specific executable name
const getBackendExecutableName = () => {
  return process.platform === 'win32' ? 'api.exe' : 'api';
};

const BACKEND_API_PATH = app.isPackaged
  ? path.join(
      process.resourcesPath,
      'src',
      'backend',
      'dist',
      getBackendExecutableName(),
    )
  : path.join(__dirname, '..', 'backend', 'dist', getBackendExecutableName());

let mainWindow: BrowserWindow | null = null;

// Set up log file path
const logFilePath = app.isPackaged
  ? path.join(process.resourcesPath, 'logs', 'api.log')
  : path.join(__dirname, '..', 'logs', 'api.log');

// Ensure the log directory exists
fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

const logFile = fs.createWriteStream(logFilePath, { flags: 'a' });

// Start the backend process
const exeProcess: ChildProcess = spawn(BACKEND_API_PATH, [], {
  stdio: 'pipe',
  env: {
    ...process.env,
    // Add any platform-specific environment variables here if needed
  },
});

// Pipe stdout and stderr to the log file
exeProcess.stdout.on('data', (data) => {
  logFile.write(`stdout: ${data}\n`);
  console.log(`stdout: ${data}`);
});

exeProcess.stderr.on('data', (data) => {
  logFile.write(`stderr: ${data}\n`);
  console.error(`stderr: ${data}`);
});

exeProcess.on('close', (code) => {
  logFile.write(`Child process exited with code ${code}\n`);
});

// End backend code
ipcMain.handle('get-version', async (event, arg) => {
  return app.getVersion();
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.handle('save-report-dialog', async (event, reportData) => {
  const window = BrowserWindow.getFocusedWindow();
  const options = {
    title: 'Save Report',
    defaultPath: app.getPath('downloads'),
    buttonLabel: 'Save',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  };
  const { filePath } = await dialog.showSaveDialog(window, options);
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
  }
});

ipcMain.handle('build-path-dialog', async (event, defaultPath) => {
  const window = BrowserWindow.getFocusedWindow();
  const options = {
    title: 'Build PDF',
    defaultPath: defaultPath || app.getPath('downloads'),
    buttonLabel: 'Build',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  };
  const { filePath } = await dialog.showSaveDialog(window, options);
  if (filePath) {
    return filePath;
  }
});

ipcMain.handle(
  'directory-dialog',
  async (event, { currentDirectory, isRoot }) => {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
      title: 'Base Directory',
      defaultPath: currentDirectory || app.getPath('downloads'),
      buttonLabel: 'Set',
      properties: ['openDirectory'],
    };
    const { filePaths } = await dialog.showOpenDialog(window, options);
    if (!filePaths || filePaths.length === 0) {
      return null;
    }
    const chosenPath = filePaths[0];
    return isRoot
      ? chosenPath
      : currentDirectory != null
        ? path.relative(currentDirectory, chosenPath)
        : chosenPath;
  },
);

ipcMain.handle('load-report-dialog', async (event) => {
  const window = BrowserWindow.getFocusedWindow();
  const options = {
    title: 'Load PDF Template',
    defaultPath: app.getPath('downloads'),
    buttonLabel: 'Open',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  };
  const { filePaths } = await dialog.showOpenDialog(window, options);
  if (filePaths && filePaths[0]) {
    const data = fs.readFileSync(filePaths[0], 'utf-8');
    return JSON.parse(data);
  }
  return null;
});

ipcMain.handle('get-relative-path', async (event, { from, to }) => {
  try {
    return path.relative(from, to);
  } catch (error) {
    console.error('Error calculating relative path:', error);
    return to; // fallback to absolute path if relative calculation fails
  }
});

ipcMain.handle('resolve-path', async (event, { base, relative }) => {
  try {
    return path.resolve(base, relative);
  } catch (error) {
    console.error('Error resolving path:', error);
    return relative; // fallback to original path if resolution fails
  }
});

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return true;
  } catch (error) {
    console.error('Error opening file:', error);
    return false;
  }
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  // if (isDebug) {
  //   await installExtensions()
  // }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1230,
    height: 874,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (mainWindow == null) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.removeMenu();
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  killAllApiProcesses(); // Kill all "api.exe" processes
});

app
  .whenReady()
  .then(() => {
    // Set AppUserModelId for Windows notifications
    if (process.platform === 'win32') {
      app.setAppUserModelId('PDFBuilder');
    }
    createWindow();
    checkForUpdates(mainWindow);
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// Function to kill backend processes based on platform
function killAllApiProcesses() {
  const isWin = process.platform === 'win32';
  if (isWin) {
    exec('taskkill /IM api.exe /F', (err, stdout, stderr) => {
      if (err) {
        console.error(`Error killing api.exe processes: ${stderr}`);
      } else {
        console.log(`Killed all api.exe processes: ${stdout}`);
      }
    });
  } else {
    // On Unix-like systems (Mac/Linux), use pkill
    exec('pkill -f api', (err, stdout, stderr) => {
      if (err && err.code !== 1) {
        // pkill returns 1 if no processes found
        console.error(`Error killing api processes: ${stderr}`);
      } else {
        console.log('Killed all api processes');
      }
    });
  }
}
