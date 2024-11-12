const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');
const { exec } = require('child_process');

const NETWORK_DRIVE_PATH = '\\\\Lab-Main\\SYS\\data\\PDFBuilder';

function getNetworkVersion() {
  try {
    // Test network drive access first
    if (!fs.existsSync(NETWORK_DRIVE_PATH)) {
      console.log('Network drive is not accessible');
      return null;
    }

    const files = fs.readdirSync(NETWORK_DRIVE_PATH);
    const setupFile = files.find(
      (file) => file.startsWith('PDFBuilder Setup') && file.endsWith('.exe'),
    );

    if (!setupFile) {
      console.log('No setup file found on network drive');
      return null;
    }

    const versionMatch = setupFile.match(
      /PDFBuilder Setup[^\d]*(\d+\.\d+\.\d+)/i,
    );
    return versionMatch ? versionMatch[1] : null;
  } catch (error) {
    console.log('Network drive is not accessible:', error.message);
    return null;
  }
}

function killProcessesAndUpdate(setupPath) {
  const batchContent = `
    @echo off
    timeout /t 1 /nobreak > nul
    taskkill /IM "api.exe" /F
    taskkill /IM "PDFBuilder.exe" /F
    timeout /t 1 /nobreak > nul
    start "" "${setupPath}"
    exit
  `;

  const tempBatchPath = path.join(app.getPath('temp'), 'update.bat');

  try {
    fs.writeFileSync(tempBatchPath, batchContent);
    exec(`start "" "${tempBatchPath}"`, (err) => {
      if (err) {
        console.error('Failed to start update batch file:', err);
      } else {
        app.quit();
      }
    });
  } catch (error) {
    console.error('Error creating batch file:', error);
  }
}

async function showUpdateDialog(mainWindow, currentVersion, networkVersion) {
  const response = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available!',
    detail: `Would you like to update from version ${currentVersion} to ${networkVersion}?`,
    buttons: ['Update Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
    modal: true,
  });

  return response.response === 0;
}

async function checkForUpdates(mainWindow) {
  try {
    const currentVersion = app.getVersion();
    const networkVersion = getNetworkVersion();

    if (!networkVersion) {
      console.log(
        'Could not determine network version - continuing without update check',
      );
      return;
    }

    console.log(`Current version: ${currentVersion}`);
    console.log(`Network version: ${networkVersion}`);

    // Compare versions
    if (networkVersion !== currentVersion) {
      console.log('Update available. Showing dialog...');

      // Wait for the main window to be ready
      if (mainWindow && !mainWindow.isVisible()) {
        await new Promise((resolve) =>
          mainWindow.once('ready-to-show', resolve),
        );
      }

      const shouldUpdate = await showUpdateDialog(
        mainWindow,
        currentVersion,
        networkVersion,
      );

      if (shouldUpdate) {
        console.log('User accepted update. Starting installer...');
        const setupPath = path.join(
          NETWORK_DRIVE_PATH,
          `PDFBuilder Setup ${networkVersion}.exe`,
        );
        killProcessesAndUpdate(setupPath);
      } else {
        console.log('User declined update');
      }
    } else {
      console.log('Application is up to date');
    }
  } catch (error) {
    console.error('Error during update check:', error);
    // Continue running the app even if update check fails
    return;
  }
}

module.exports = checkForUpdates;
