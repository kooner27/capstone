import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'

// Define constants for virtual environment
const APP_DATA_DIR = path.join(os.homedir(), '.twonote');
const VENV_DIR = path.join(APP_DATA_DIR, 'venv');

// Ensure app data directory exists
function ensureAppDataDir() {
  if (!fs.existsSync(APP_DATA_DIR)) {
    fs.mkdirSync(APP_DATA_DIR, { recursive: true });
  }
  return APP_DATA_DIR;
}

// Check Python installation
async function checkPythonInstallation() {
  try {
    // Determine commands based on platform
    const pythonCommands = process.platform === 'win32' 
      ? ['python', 'py'] 
      : ['python3', 'python'];
    const pipCommands = process.platform === 'win32'
      ? ['pip', 'pip3']
      : ['pip3', 'pip'];
    
    // Try different Python commands
    let pythonResult = { installed: false, version: '' };
    
    for (const cmd of pythonCommands) {
      try {
        const { stdout } = await execCommand(`${cmd} --version`);
        // Parse version from output (usually in format "Python X.Y.Z")
        const versionMatch = stdout.toString().match(/Python\s+(\d+\.\d+\.\d+)/i);
        pythonResult = {
          installed: true,
          version: versionMatch ? versionMatch[1] : stdout.toString().trim()
        };
        break; // Found working Python command
      } catch (err) {
        // Try next command
        continue;
      }
    }
    
    // Try different pip commands
    let pipResult = { installed: false, version: '' };
    
    for (const cmd of pipCommands) {
      try {
        const { stdout } = await execCommand(`${cmd} --version`);
        // Parse version from output (usually in format "pip X.Y.Z from /path")
        const versionMatch = stdout.toString().match(/pip\s+(\d+\.\d+(\.\d+)?)/i);
        pipResult = {
          installed: true,
          version: versionMatch ? versionMatch[1] : stdout.toString().trim()
        };
        break; // Found working pip command
      } catch (err) {
        // Try next command
        continue;
      }
    }
    
    return {
      python: pythonResult,
      pip: pipResult
    };
  } catch (error) {
    console.error('Error checking Python installation:', error);
    return {
      error: error.message,
      python: { installed: false },
      pip: { installed: false }
    };
  }
}

// Helper function to execute shell commands
function execCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, { shell: true });
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    childProcess.on('error', (err) => {
      reject(err);
    });
  });
}

// Check if virtual environment exists
async function checkVenvExists() {
  try {
    ensureAppDataDir();
    
    // Check if venv directory exists
    const venvExists = fs.existsSync(VENV_DIR);
    
    // If venv exists, check if it has a Python interpreter
    let hasInterpreter = false;
    if (venvExists) {
      const interpreterPath = getVenvPythonPath();
      hasInterpreter = fs.existsSync(interpreterPath);
    }
    
    return {
      exists: venvExists && hasInterpreter,
      path: VENV_DIR
    };
  } catch (error) {
    console.error('Error checking venv:', error);
    return {
      exists: false,
      error: error.message
    };
  }
}

// Get Python path inside virtual environment
function getVenvPythonPath() {
  if (process.platform === 'win32') {
    return path.join(VENV_DIR, 'Scripts', 'python.exe');
  } else {
    return path.join(VENV_DIR, 'bin', 'python');
  }
}

// Create virtual environment
async function createVirtualEnvironment() {
  try {
    ensureAppDataDir();
    
    // Check if venv already exists
    const venvCheck = await checkVenvExists();
    if (venvCheck.exists) {
      return {
        success: true,
        message: 'Virtual environment already exists'
      };
    }
    
    // Check Python installation
    const pyCheck = await checkPythonInstallation();
    if (!pyCheck.python.installed) {
      return {
        success: false,
        error: 'Python is not installed'
      };
    }
    
    // Determine Python command
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // Create virtual environment
    const createCmd = `${pythonCmd} -m venv "${VENV_DIR}"`;
    await execCommand(createCmd);
    
    // Verify creation
    const verifyCheck = await checkVenvExists();
    
    return {
      success: verifyCheck.exists,
      message: verifyCheck.exists 
        ? 'Virtual environment created successfully' 
        : 'Failed to create virtual environment'
    };
  } catch (error) {
    console.error('Error creating venv:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to list installed packages in the virtual environment
async function listInstalledPackages() {
  try {
    // Check if venv exists
    const venvCheck = await checkVenvExists();
    if (!venvCheck.exists) {
      return {
        success: false,
        error: 'Virtual environment not found',
        packages: []
      };
    }
    
    // Get pip path
    const pipPath = process.platform === 'win32'
      ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
      : path.join(VENV_DIR, 'bin', 'pip');
    
    // Run pip list command with JSON output format
    const { stdout } = await execCommand(`"${pipPath}" list --format=json`);
    
    // Parse the JSON output
    const packages = JSON.parse(stdout);
    
    return {
      success: true,
      packages: packages
    };
  } catch (error) {
    console.error('Error listing installed packages:', error);
    
    // Special handling for common errors
    if (error.message.includes('no such file or directory')) {
      return {
        success: false,
        error: 'Pip executable not found in virtual environment',
        packages: []
      };
    }
    
    if (error.message.includes('SyntaxError: Unexpected token')) {
      // Older pip versions might not support JSON output
      try {
        // Fallback to text format and parse it manually
        const pipPath = process.platform === 'win32'
          ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
          : path.join(VENV_DIR, 'bin', 'pip');
        
        const { stdout } = await execCommand(`"${pipPath}" list`);
        
        // Parse the text output
        // Format is typically:
        // Package    Version
        // -------    -------
        // package1   1.0.0
        // package2   2.0.0
        
        const lines = stdout.split('\n').slice(2); // Skip header lines
        const packages = lines
          .filter(line => line.trim()) // Skip empty lines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              return {
                name: parts[0],
                version: parts[1]
              };
            }
            return null;
          })
          .filter(pkg => pkg !== null);
        
        return {
          success: true,
          packages: packages
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: `Failed to parse pip output: ${fallbackError.message}`,
          packages: []
        };
      }
    }
    
    return {
      success: false,
      error: error.message,
      packages: []
    };
  }
}

// Install packages from requirements.txt
// Enhanced installRequirements function with build error handling
async function installRequirements(requirementsPath) {
  try {
    // Check if venv exists
    const venvCheck = await checkVenvExists();
    if (!venvCheck.exists) {
      // Try to create it
      const createResult = await createVirtualEnvironment();
      if (!createResult.success) {
        return {
          success: false,
          error: `Could not create virtual environment: ${createResult.error}`
        };
      }
    }
    
    // Get pip and python paths
    const pythonPath = process.platform === 'win32'
      ? path.join(VENV_DIR, 'Scripts', 'python.exe')
      : path.join(VENV_DIR, 'bin', 'python');
    
    const pipPath = process.platform === 'win32'
      ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
      : path.join(VENV_DIR, 'bin', 'pip');
    
    // Setup phase: Fix common issues that prevent installation
    let setupLog = [];
    
    // Step 1: Ensure basic build tools are installed first
    setupLog.push('Installing essential build tools...');
    
    try {
      await execCommand(`"${pythonPath}" -m pip install --upgrade pip setuptools wheel`);
      setupLog.push('Successfully installed essential build tools');
    } catch (error) {
      setupLog.push(`Warning: Failed to install build tools: ${error.message}`);
    }
    
    // Read requirements file to understand what we need to install
    const requirements = fs.readFileSync(requirementsPath, 'utf8');
    const packageLines = requirements.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    setupLog.push(`Found ${packageLines.length} packages to install`);
    
    // Identify scientific packages that often need special handling
    const scientificPackages = packageLines.filter(line => 
      line.startsWith('numpy') || 
      line.startsWith('scipy') || 
      line.startsWith('pandas') || 
      line.startsWith('matplotlib') ||
      line.startsWith('scikit-learn')
    );
    
    // Try different installation strategies
    let installSuccess = false;
    let installError = '';
    let installOutput = '';
    
    // Strategy 1: Try installing with --only-binary option for scientific packages
    if (scientificPackages.length > 0) {
      setupLog.push('Strategy 1: Installing scientific packages with pre-compiled binaries...');
      try {
        // Install scientific packages separately with --only-binary
        for (const pkg of scientificPackages) {
          setupLog.push(`Installing ${pkg} with binary option...`);
          await execCommand(`"${pipPath}" install --only-binary=:all: ${pkg}`);
          setupLog.push(`Successfully installed ${pkg}`);
        }
        
        // Remove scientific packages from the main list
        const remainingPackages = packageLines.filter(pkg => !scientificPackages.includes(pkg));
        
        if (remainingPackages.length > 0) {
          setupLog.push(`Installing ${remainingPackages.length} remaining packages...`);
          // Install the rest of the packages
          await execCommand(`"${pipPath}" install ${remainingPackages.join(' ')}`);
          setupLog.push('Successfully installed all remaining packages');
        }
        
        installSuccess = true;
      } catch (error) {
        setupLog.push(`Strategy 1 failed: ${error.message}`);
        installError = error.message;
      }
    }
    
    // Strategy 2: If strategy 1 failed or wasn't attempted, try with --prefer-binary flag
    if (!installSuccess) {
      setupLog.push('Strategy 2: Installing all packages with prefer-binary option...');
      try {
        await execCommand(`"${pipPath}" install --prefer-binary -r "${requirementsPath}"`);
        setupLog.push('Strategy 2 succeeded: All packages installed with prefer-binary option');
        installSuccess = true;
      } catch (error) {
        setupLog.push(`Strategy 2 failed: ${error.message}`);
        installError = error.message;
      }
    }
    
    // Strategy 3: If previous strategies failed, try installing packages one by one
    if (!installSuccess) {
      setupLog.push('Strategy 3: Installing packages individually...');
      
      let successPackages = [];
      let failedPackages = [];
      
      for (const pkg of packageLines) {
        setupLog.push(`Installing ${pkg}...`);
        try {
          // Try with --prefer-binary first
          await execCommand(`"${pipPath}" install --prefer-binary ${pkg}`);
          successPackages.push(pkg);
          setupLog.push(`Successfully installed ${pkg}`);
        } catch (firstError) {
          // If that fails, try without any options
          try {
            setupLog.push(`Retrying ${pkg} without options...`);
            await execCommand(`"${pipPath}" install ${pkg}`);
            successPackages.push(pkg);
            setupLog.push(`Successfully installed ${pkg} without options`);
          } catch (secondError) {
            // As a last resort, try with --no-deps flag
            try {
              setupLog.push(`Trying ${pkg} with --no-deps flag...`);
              await execCommand(`"${pipPath}" install --no-deps ${pkg}`);
              successPackages.push(`${pkg} (without dependencies)`);
              setupLog.push(`Installed ${pkg} without dependencies`);
            } catch (thirdError) {
              failedPackages.push(pkg);
              setupLog.push(`Failed to install ${pkg}: ${thirdError.message}`);
            }
          }
        }
      }
      
      if (successPackages.length > 0) {
        setupLog.push(`Successfully installed ${successPackages.length} out of ${packageLines.length} packages`);
        installSuccess = true;
        if (failedPackages.length > 0) {
          installError = `Failed to install ${failedPackages.length} package(s): ${failedPackages.join(', ')}`;
        }
      } else {
        setupLog.push('Failed to install any packages');
        installSuccess = false;
        installError = 'Could not install any packages using any strategy';
      }
    }
    
    // Compile the full log and return results
    installOutput = setupLog.join('\n');
    
    return {
      success: installSuccess,
      output: installOutput,
      error: installError,
      partial: installSuccess && installError !== ''
    };
  } catch (error) {
    console.error('Error in installation process:', error);
    return {
      success: false,
      error: `Installation process error: ${error.message}`,
      output: `An error occurred in the installation process: ${error.message}`
    };
  }
}


// Execute Python code directly (enhanced to use venv)
// Execute Python code with better environment setup
async function executePython(code, useVenv = true) {
  return new Promise((resolve, reject) => {
    // Determine which Python to use
    let pythonCommand;
    let pythonEnv = { ...process.env };
    
    if (useVenv) {
      // Use virtual environment Python if available
      pythonCommand = getVenvPythonPath();
      
      // Check if it exists
      if (!fs.existsSync(pythonCommand)) {
        // Fall back to system Python
        pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        console.log('Virtual environment Python not found, falling back to system Python');
      } else {
        // Set environment variables for the virtual environment
        if (process.platform === 'win32') {
          // For Windows
          pythonEnv.PATH = `${path.dirname(pythonCommand)};${pythonEnv.PATH}`;
          pythonEnv.VIRTUAL_ENV = VENV_DIR;
        } else {
          // For macOS/Linux
          pythonEnv.PATH = `${path.dirname(pythonCommand)}:${pythonEnv.PATH}`;
          pythonEnv.VIRTUAL_ENV = VENV_DIR;
        }
      }
    } else {
      // Use system Python
      pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    }
    
    console.log(`Using Python command: ${pythonCommand}`);
    
    // Launch Python with the appropriate environment
    const pythonProcess = spawn(pythonCommand, ['-u'], { env: pythonEnv });
    
    let output = '';
    let error = '';
    
    // Collect standard output
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    // Collect error output
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (exitCode) => {
      resolve({
        output,
        error,
        exitCode
      });
    });
    
    // Handle process errors
    pythonProcess.on('error', (err) => {
      reject({
        message: `Failed to start Python: ${err.message}`,
        error: 'Could not start Python process. Is Python installed?'
      });
    });
    
    // Set a timeout to kill the process if it takes too long
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject({
        message: 'Python execution timed out after 30 seconds',
        error: 'Execution timed out'
      });
    }, 30000);
    
    // Clear the timeout when the process ends
    pythonProcess.on('close', () => {
      clearTimeout(timeout);
    });
    
    // Write the code to the Python process
    pythonProcess.stdin.write(code + '\n');
    
    // Send exit() command after a short delay to close the REPL
    setTimeout(() => {
      pythonProcess.stdin.write('\nexit()\n');
      pythonProcess.stdin.end();
    }, 1000);
  });
}

// Select requirements.txt file
async function selectRequirementsFile() {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Requirements File', extensions: ['txt'] }
      ],
      title: 'Select requirements.txt File'
    });
    
    if (canceled || filePaths.length === 0) {
      return {
        canceled: true
      };
    }
    
    const filePath = filePaths[0];
    const fileName = path.basename(filePath);
    
    return {
      canceled: false,
      filePath,
      fileName
    };
  } catch (error) {
    console.error('Error selecting requirements file:', error);
    return {
      error: error.message
    };
  }
}

// Setup handlers for Python functionality
function setupPythonHandlers(ipcMain) {
  // Check Python installation
  ipcMain.handle('checkPythonInstallation', async () => {
    try {
      return await checkPythonInstallation();
    } catch (error) {
      console.error('Error in checkPythonInstallation handler:', error);
      return { error: error.message };
    }
  });
  
  // Check virtual environment status
  ipcMain.handle('checkVenvStatus', async () => {
    try {
      return await checkVenvExists();
    } catch (error) {
      console.error('Error in checkVenvStatus handler:', error);
      return { error: error.message };
    }
  });
  
  // Create virtual environment
  ipcMain.handle('createVenv', async () => {
    try {
      return await createVirtualEnvironment();
    } catch (error) {
      console.error('Error in createVenv handler:', error);
      return { error: error.message };
    }
  });
  
  // Select requirements.txt file
  ipcMain.handle('selectRequirementsFile', async () => {
    try {
      return await selectRequirementsFile();
    } catch (error) {
      console.error('Error in selectRequirementsFile handler:', error);
      return { error: error.message };
    }
  });
  
  // Install requirements
  ipcMain.handle('installRequirements', async (event, requirementsPath) => {
    try {
      return await installRequirements(requirementsPath);
    } catch (error) {
      console.error('Error in installRequirements handler:', error);
      return { error: error.message };
    }
  });
  
  // List installed packages
  ipcMain.handle('listInstalledPackages', async () => {
    try {
      return await listInstalledPackages();
    } catch (error) {
      console.error('Error in listInstalledPackages handler:', error);
      return { 
        success: false, 
        error: error.message,
        packages: []
      };
    }
  });
  
  // Run Python code
  ipcMain.handle('runPython', async (event, code, useVenv = true) => {
    try {
      return await executePython(code, useVenv);
    } catch (error) {
      console.error('Error in runPython handler:', error);
      return {
        error: error.message || 'Unknown error',
        output: ''
      };
    }
  });
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler for opening file dialog
  ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Markdown Files', extensions: ['md'] }
      ]
    })
    
    if (canceled || filePaths.length === 0) {
      return { success: false }
    }
    
    try {
      const filePath = filePaths[0]
      const content = fs.readFileSync(filePath, 'utf8')
      const fileName = filePath.split(/[/\\]/).pop()
      
      return {
        success: true,
        fileName,
        content
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  // Set up all Python-related IPC handlers
  setupPythonHandlers(ipcMain)

  // Ensure app data directory exists
  ensureAppDataDir()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})