import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { spawn } from 'child_process' // Add this import

// Add Python execution directly in main process
function setupPythonHandlers(ipcMain) {
  // Run Python code via direct process
  ipcMain.handle('run-python', async (event, code) => {
    try {
      return await executePython(code);
    } catch (error) {
      console.error('Error executing Python:', error);
      return {
        error: error.message || 'Unknown error',
        output: ''
      };
    }
  });
}

// Execute Python code directly (no intermediate Node.js process)
async function executePython(code) {
  return new Promise((resolve, reject) => {
    // Determine the Python command based on platform
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Launch Python in interactive mode (-i) and with unbuffered output (-u)
    const pythonProcess = spawn(pythonCommand, ['-u']);
    
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
      // added
      // webSecurity: false,
      // contextIsolation: false,
      // nodeIntegration: true, // this is false by default which is best practice
      // nodeIntegrationInWorker: true
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

  // Add Python execution handlers
  setupPythonHandlers(ipcMain)

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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.