import path from 'path'
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { exec } from 'child_process' // Import exec from child_process

class AppUpdater {
  constructor () {
    log.transports.file.level = 'info'
    autoUpdater.logger = log
    autoUpdater.checkForUpdatesAndNotify()
  }
}

// Start backend code
const controller = new AbortController()
const signal = controller.signal

const BACKEND_API_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'src', 'backend', 'dist', 'api.exe')
  : path.join(__dirname, '..', 'backend', 'dist', 'api.exe')

let mainWindow: BrowserWindow | null = null
const exeProcess: ChildProcess = spawn(BACKEND_API_PATH, [], {})

// End backend code

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`
  console.log(msgTemplate(arg))
  event.reply('ipc-example', msgTemplate('pong'))
})

ipcMain.handle('save-report-dialog', async (event, reportData) => {
  const window = BrowserWindow.getFocusedWindow()
  const options = {
    title: 'Save Report',
    defaultPath: app.getPath('downloads'),
    buttonLabel: 'Save',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  }
  const { filePath } = await dialog.showSaveDialog(window, options)
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2))
  }
})

ipcMain.handle('build-path-dialog', async (event, defaultPath) => {
  const window = BrowserWindow.getFocusedWindow()
  const options = {
    title: 'Build PDF',
    defaultPath: defaultPath ? defaultPath : app.getPath('downloads'),
    buttonLabel: 'Build',
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  }
  const { filePath } = await dialog.showSaveDialog(window, options)
  if (filePath) {
    return filePath
  }
})

ipcMain.handle('load-report-dialog', async (event) => {
  const window = BrowserWindow.getFocusedWindow()
  const options = {
    title: 'Load PDF Template',
    defaultPath: app.getPath('downloads'),
    buttonLabel: 'Open',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  }
  const { filePaths } = await dialog.showOpenDialog(window, options)
  if (filePaths && filePaths[0]) {
    const data = fs.readFileSync(filePaths[0], 'utf-8')
    return JSON.parse(data)
  }
  return null
})

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

if (isDebug) {
  require('electron-debug')()
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer')
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS
  const extensions = ['REACT_DEVELOPER_TOOLS']

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log)
}

const createWindow = async () => {
  // if (isDebug) {
  //   await installExtensions()
  // }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets')

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths)
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js')
    }
  })

  mainWindow.loadURL(resolveHtmlPath('index.html'))

  mainWindow.on('ready-to-show', () => {
    if (mainWindow == null) {
      throw new Error('"mainWindow" is not defined')
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize()
    } else {
      mainWindow.show()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const menuBuilder = new MenuBuilder(mainWindow)
  menuBuilder.buildMenu()

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url)
    return { action: 'deny' }
  })

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  killAllApiProcesses() // Kill all "api.exe" processes
})

app
  .whenReady()
  .then(() => {
    createWindow()
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow()
    })
  })
  .catch(console.log)

// Function to kill all "api.exe" processes
function killAllApiProcesses () {
  exec('taskkill /IM api.exe /F', (err, stdout, stderr) => {
    if (err != null) {
      console.error(`Error killing api.exe processes: ${stderr}`)
    } else {
      console.log(`Killed all api.exe processes: ${stdout}`)
    }
  })
}
