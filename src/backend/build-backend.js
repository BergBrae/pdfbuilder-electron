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
  const isWin = process.platform === 'win32';
  return path.join(currentDir, isWin ? '.venv' : '.macenv');
}

// Function to get the correct path to the virtual environment's executables
function getVenvBinPath() {
  const venvPath = getVenvPath();
  return process.platform === 'win32'
    ? path.join(venvPath, 'Scripts')
    : path.join(venvPath, 'bin');
}

// Function to escape paths for shell commands
function escapePath(p) {
  // Wrap the path in quotes and escape any existing quotes
  return `"${p.replace(/"/g, '\\"')}"`;
}

try {
  const { pythonCmd, pipCmd } = getPythonCommands();
  const venvPath = getVenvPath();
  const venvBinPath = getVenvBinPath();

  // Create the virtual environment only if it doesn't exist
  if (!fs.existsSync(venvPath)) {
    // First, ensure the directory is clean if it exists partially
    if (fs.existsSync(venvPath)) {
      fs.rmSync(venvPath, { recursive: true, force: true });
    }

    const createVenvCommand = `${pythonCmd} -m venv ${escapePath(venvPath)}`;
    console.log(`Creating virtual environment: ${createVenvCommand}`);
    execSync(createVenvCommand, { stdio: 'inherit', shell: true });
  } else {
    console.log('Using existing virtual environment');
  }

  // Install requirements.txt
  const requirementsPath = path.join(currentDir, 'requirements.txt');
  const pipPath = path.join(venvBinPath, pipCmd);
  const installRequirementsCommand = `${escapePath(
    pipPath,
  )} install -r ${escapePath(requirementsPath)}`;
  console.log(`Installing requirements: ${installRequirementsCommand}`);
  execSync(installRequirementsCommand, { stdio: 'inherit', shell: true });

  // Install Windows-specific requirements if on Windows
  if (process.platform === 'win32') {
    const winRequirementsPath = path.join(currentDir, 'requirements-win.txt');
    if (fs.existsSync(winRequirementsPath)) {
      const installWinRequirementsCommand = `${escapePath(
        pipPath,
      )} install -r ${escapePath(winRequirementsPath)}`;
      console.log(
        `Installing Windows requirements: ${installWinRequirementsCommand}`,
      );
      execSync(installWinRequirementsCommand, {
        stdio: 'inherit',
        shell: true,
      });
    }
  }

  // Run PyInstaller using the virtual environment's Python
  const apiPath = path.join(currentDir, 'api.py');
  const pyinstallerPath = path.join(venvBinPath, 'pyinstaller');

  // Define the path to all_methods.txt
  const allMethodsPath = path.join(
    currentDir,
    'initialization',
    'all_methods.txt',
  );

  // Create the PyInstaller command with the --add-data option to include all_methods.txt
  // The format is source;destination where destination is relative to the executable
  const dataOption =
    process.platform === 'win32'
      ? `--add-data ${escapePath(allMethodsPath)};initialization`
      : `--add-data ${escapePath(allMethodsPath)}:initialization`;

  const runPyInstallerCommand = `${escapePath(
    pyinstallerPath,
  )} --onefile ${dataOption} ${escapePath(apiPath)}`;

  console.log(`Running PyInstaller: ${runPyInstallerCommand}`);
  execSync(runPyInstallerCommand, { stdio: 'inherit', shell: true });

  console.log('Build completed successfully');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}
