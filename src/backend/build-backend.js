const { execSync } = require('child_process');

try {
  // Activate the virtual environment and run PyInstaller
  const activateCommand =
    process.platform === 'win32'
      ? '.venv\\Scripts\\activate && pyinstaller --onefile api.py'
      : 'source .venv/bin/activate && pyinstaller --onefile api.py';
  execSync(activateCommand, { stdio: 'inherit', shell: true });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}
