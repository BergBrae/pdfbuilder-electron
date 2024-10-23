const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the current directory
const currentDir = __dirname;

// Function to get the correct Python and pip commands
function getPythonCommands() {
  const isWin = process.platform === 'win32';
  const pythonCmd = isWin ? 'python' : 'python3';
  const pipCmd = isWin ? 'pip' : 'pip3';
  return { pythonCmd, pipCmd };
}

// Function to get the virtual environment path
function getVenvPath() {
  return path.join(currentDir, '.venv');
}

// Function to get the correct path to the virtual environment's executables
function getVenvBinPath() {
  const venvPath = getVenvPath();
  return process.platform === 'win32'
    ? path.join(venvPath, 'Scripts')
    : path.join(venvPath, 'bin');
}

try {
  const { pythonCmd, pipCmd } = getPythonCommands();
  const venvPath = getVenvPath();
  const venvBinPath = getVenvBinPath();

  // Delete the existing virtual environment if it exists
  if (fs.existsSync(venvPath)) {
    console.log(`Removing existing virtual environment: ${venvPath}`);
    fs.rmSync(venvPath, { recursive: true, force: true });
  }

  // Create the virtual environment
  const createVenvCommand = `${pythonCmd} -m venv ${venvPath}`;
  console.log(`Creating virtual environment: ${createVenvCommand}`);
  execSync(createVenvCommand, { stdio: 'inherit', shell: true });

  // Install requirements.txt
  const requirementsPath = path.join(currentDir, 'requirements.txt');
  const installRequirementsCommand = `"${path.join(
    venvBinPath,
    pipCmd,
  )}" install -r "${requirementsPath}"`;
  console.log(`Installing requirements: ${installRequirementsCommand}`);
  execSync(installRequirementsCommand, { stdio: 'inherit', shell: true });

  // Run PyInstaller using the virtual environment's Python
  const apiPath = path.join(currentDir, 'api.py');
  const pyinstallerPath = path.join(venvBinPath, 'pyinstaller');
  const runPyInstallerCommand = `"${pyinstallerPath}" --onefile "${apiPath}"`;
  console.log(`Running PyInstaller: ${runPyInstallerCommand}`);
  execSync(runPyInstallerCommand, { stdio: 'inherit', shell: true });

  console.log('Build completed successfully');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}
