const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Check if virtual environment exists
  if (!fs.existsSync('.venv')) {
    // Create the virtual environment
    const createVenvCommand =
      process.platform === 'win32'
        ? 'python -m venv .venv'
        : 'python3 -m venv .venv';
    execSync(createVenvCommand, { stdio: 'inherit', shell: true });
  }

  // Install requirements.txt
  const installRequirementsCommand =
    process.platform === 'win32'
      ? '.venv\\Scripts\\pip install -r requirements.txt'
      : '.venv/bin/pip install -r requirements.txt';
  execSync(installRequirementsCommand, { stdio: 'inherit', shell: true });

  // Run PyInstaller using the virtual environment's Python
  const runPyInstallerCommand =
    process.platform === 'win32'
      ? '.venv\\Scripts\\pyinstaller --onefile api.py'
      : '.venv/bin/pyinstaller --onefile api.py';
  execSync(runPyInstallerCommand, { stdio: 'inherit', shell: true });

  console.log('Build completed successfully');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}
