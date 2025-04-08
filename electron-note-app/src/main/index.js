/*
This code block is the main node js process running in electron
It exposes lower level apis necessary for code execution and import/export functionality
It handles hierarchical import export as well as local code execution.
It covers FR26, FR27, and FR28
*/
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'

import { v4 as uuidv4 } from 'uuid'

import AdmZip from 'adm-zip'

const APP_DATA_DIR = path.join(os.homedir(), '.twonote')
const VENV_DIR = path.join(APP_DATA_DIR, 'venv')

async function exportToZip(event, allData) {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Backup',
      defaultPath: path.join(app.getPath('documents'), 'twonote-backup.zip'),
      buttonLabel: 'Save Backup',
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    })

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    const tempDir = path.join(app.getPath('temp'), `twonote-backup-${uuidv4()}`)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const manifestData = {
      version: 1,
      timestamp: new Date().toISOString(),
      appVersion: app.getVersion(),
      notebooks: []
    }

    for (const notebook of allData.notebooks) {
      const notebookData = {
        id: notebook._id,
        name: notebook.name,
        labels: notebook.labels || [],
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        sections: []
      }

      const notebookDir = path.join(tempDir, `notebook_${notebook._id}`)
      fs.mkdirSync(notebookDir, { recursive: true })

      for (const section of notebook.sections) {
        const sectionData = {
          id: section._id,
          title: section.title,
          labels: section.labels || [],
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          notes: []
        }

        const sectionDir = path.join(notebookDir, `section_${section._id}`)
        fs.mkdirSync(sectionDir, { recursive: true })

        for (const note of section.notes) {
          const noteData = {
            id: note._id,
            title: note.title,
            labels: note.labels || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            filename: `note_${note._id}.md`
          }

          const noteFilePath = path.join(sectionDir, noteData.filename)
          fs.writeFileSync(noteFilePath, note.content || '')

          sectionData.notes.push(noteData)
        }

        notebookData.sections.push(sectionData)
      }

      manifestData.notebooks.push(notebookData)
    }

    fs.writeFileSync(path.join(tempDir, 'manifest.json'), JSON.stringify(manifestData, null, 2))

    const zip = new AdmZip()
    zip.addLocalFolder(tempDir)
    zip.writeZip(filePath)

    fs.rmSync(tempDir, { recursive: true, force: true })

    return {
      success: true,
      filePath
    }
  } catch (error) {
    console.error('Error creating backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function selectBackupFile(event) {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Backup File',
      buttonLabel: 'Select Backup',
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    return {
      success: true,
      filePath: filePaths[0]
    }
  } catch (error) {
    console.error('Error selecting backup file:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function validateBackupZip(event, filePath) {
  try {
    const tempDir = path.join(app.getPath('temp'), `twonote-import-${uuidv4()}`)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const zip = new AdmZip(filePath)
    zip.extractAllTo(tempDir, true)

    const manifestPath = path.join(tempDir, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      return {
        valid: false,
        error: 'Invalid backup file: manifest.json not found'
      }
    }

    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

    if (!manifestData.version || !manifestData.notebooks) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      return {
        valid: false,
        error: 'Invalid backup file: invalid manifest format'
      }
    }

    global.importTempDir = tempDir
    global.importManifest = manifestData

    let notebookCount = 0
    let sectionCount = 0
    let noteCount = 0
    const notebooks = []

    for (const notebook of manifestData.notebooks) {
      notebookCount++
      let notebookNoteCount = 0

      for (const section of notebook.sections) {
        sectionCount++
        notebookNoteCount += section.notes.length
        noteCount += section.notes.length

        for (const note of section.notes) {
          const notePath = path.join(
            tempDir,
            `notebook_${notebook.id}`,
            `section_${section.id}`,
            note.filename
          )

          if (!fs.existsSync(notePath)) {
            console.warn(`Note file not found: ${notePath}`)
          }
        }
      }

      notebooks.push({
        name: notebook.name,
        sectionCount: notebook.sections.length,
        noteCount: notebookNoteCount
      })
    }

    return {
      valid: true,
      summary: {
        timestamp: manifestData.timestamp,
        appVersion: manifestData.appVersion || 'Unknown',
        notebookCount,
        sectionCount,
        noteCount,
        notebooks
      }
    }
  } catch (error) {
    console.error('Error validating backup file:', error)

    if (global.importTempDir && fs.existsSync(global.importTempDir)) {
      fs.rmSync(global.importTempDir, { recursive: true, force: true })
      global.importTempDir = null
      global.importManifest = null
    }

    return {
      valid: false,
      error: `Invalid backup file: ${error.message}`
    }
  }
}

async function importFromBackupZip(event) {
  try {
    if (!global.importTempDir || !global.importManifest) {
      return {
        success: false,
        error: 'No validated backup to import'
      }
    }

    const tempDir = global.importTempDir
    const manifestData = global.importManifest

    const notebooks = []

    for (const notebook of manifestData.notebooks) {
      const notebookData = {
        name: notebook.name,
        labels: notebook.labels || [],
        sections: []
      }

      for (const section of notebook.sections) {
        const sectionData = {
          title: section.title,
          labels: section.labels || [],
          notes: []
        }

        for (const note of section.notes) {
          const notePath = path.join(
            tempDir,
            `notebook_${notebook.id}`,
            `section_${section.id}`,
            note.filename
          )

          let content = ''
          if (fs.existsSync(notePath)) {
            content = fs.readFileSync(notePath, 'utf8')
          }

          sectionData.notes.push({
            title: note.title,
            content: content,
            labels: note.labels || []
          })
        }

        notebookData.sections.push(sectionData)
      }

      notebooks.push(notebookData)
    }

    fs.rmSync(tempDir, { recursive: true, force: true })
    global.importTempDir = null
    global.importManifest = null

    return {
      success: true,
      data: { notebooks }
    }
  } catch (error) {
    console.error('Error importing from backup:', error)

    if (global.importTempDir && fs.existsSync(global.importTempDir)) {
      fs.rmSync(global.importTempDir, { recursive: true, force: true })
      global.importTempDir = null
      global.importManifest = null
    }

    return {
      success: false,
      error: `Error importing backup: ${error.message}`
    }
  }
}

function ensureAppDataDir() {
  if (!fs.existsSync(APP_DATA_DIR)) {
    fs.mkdirSync(APP_DATA_DIR, { recursive: true })
  }
  return APP_DATA_DIR
}

async function checkPythonInstallation() {
  try {
    const pythonCommands = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']
    const pipCommands = process.platform === 'win32' ? ['pip', 'pip3'] : ['pip3', 'pip']

    let pythonResult = { installed: false, version: '' }

    for (const cmd of pythonCommands) {
      try {
        const { stdout } = await execCommand(`${cmd} --version`)

        const versionMatch = stdout.toString().match(/Python\s+(\d+\.\d+\.\d+)/i)
        pythonResult = {
          installed: true,
          version: versionMatch ? versionMatch[1] : stdout.toString().trim()
        }
        break
      } catch (err) {
        continue
      }
    }

    let pipResult = { installed: false, version: '' }

    for (const cmd of pipCommands) {
      try {
        const { stdout } = await execCommand(`${cmd} --version`)

        const versionMatch = stdout.toString().match(/pip\s+(\d+\.\d+(\.\d+)?)/i)
        pipResult = {
          installed: true,
          version: versionMatch ? versionMatch[1] : stdout.toString().trim()
        }
        break
      } catch (err) {
        continue
      }
    }

    return {
      python: pythonResult,
      pip: pipResult
    }
  } catch (error) {
    console.error('Error checking Python installation:', error)
    return {
      error: error.message,
      python: { installed: false },
      pip: { installed: false }
    }
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, { shell: true })
    let stdout = ''
    let stderr = ''

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`))
      }
    })

    childProcess.on('error', (err) => {
      reject(err)
    })
  })
}

async function checkVenvExists() {
  try {
    ensureAppDataDir()

    const venvExists = fs.existsSync(VENV_DIR)

    let hasInterpreter = false
    if (venvExists) {
      const interpreterPath = getVenvPythonPath()
      hasInterpreter = fs.existsSync(interpreterPath)
    }

    return {
      exists: venvExists && hasInterpreter,
      path: VENV_DIR
    }
  } catch (error) {
    console.error('Error checking venv:', error)
    return {
      exists: false,
      error: error.message
    }
  }
}

function getVenvPythonPath() {
  if (process.platform === 'win32') {
    return path.join(VENV_DIR, 'Scripts', 'python.exe')
  } else {
    return path.join(VENV_DIR, 'bin', 'python')
  }
}

async function createVirtualEnvironment() {
  try {
    ensureAppDataDir()

    const venvCheck = await checkVenvExists()
    if (venvCheck.exists) {
      return {
        success: true,
        message: 'Virtual environment already exists'
      }
    }

    const pyCheck = await checkPythonInstallation()
    if (!pyCheck.python.installed) {
      return {
        success: false,
        error: 'Python is not installed'
      }
    }

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'

    const createCmd = `${pythonCmd} -m venv "${VENV_DIR}"`
    await execCommand(createCmd)

    const verifyCheck = await checkVenvExists()

    return {
      success: verifyCheck.exists,
      message: verifyCheck.exists
        ? 'Virtual environment created successfully'
        : 'Failed to create virtual environment'
    }
  } catch (error) {
    console.error('Error creating venv:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function listInstalledPackages() {
  try {
    const venvCheck = await checkVenvExists()
    if (!venvCheck.exists) {
      return {
        success: false,
        error: 'Virtual environment not found',
        packages: []
      }
    }

    const pipPath =
      process.platform === 'win32'
        ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
        : path.join(VENV_DIR, 'bin', 'pip')

    const { stdout } = await execCommand(`"${pipPath}" list --format=json`)

    const packages = JSON.parse(stdout)

    return {
      success: true,
      packages: packages
    }
  } catch (error) {
    console.error('Error listing installed packages:', error)

    if (error.message.includes('no such file or directory')) {
      return {
        success: false,
        error: 'Pip executable not found in virtual environment',
        packages: []
      }
    }

    if (error.message.includes('SyntaxError: Unexpected token')) {
      try {
        const pipPath =
          process.platform === 'win32'
            ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
            : path.join(VENV_DIR, 'bin', 'pip')

        const { stdout } = await execCommand(`"${pipPath}" list`)

        const lines = stdout.split('\n').slice(2)
        const packages = lines
          .filter((line) => line.trim())
          .map((line) => {
            const parts = line.trim().split(/\s+/)
            if (parts.length >= 2) {
              return {
                name: parts[0],
                version: parts[1]
              }
            }
            return null
          })
          .filter((pkg) => pkg !== null)

        return {
          success: true,
          packages: packages
        }
      } catch (fallbackError) {
        return {
          success: false,
          error: `Failed to parse pip output: ${fallbackError.message}`,
          packages: []
        }
      }
    }

    return {
      success: false,
      error: error.message,
      packages: []
    }
  }
}

async function installRequirements(requirementsPath) {
  try {
    const venvCheck = await checkVenvExists()
    if (!venvCheck.exists) {
      const createResult = await createVirtualEnvironment()
      if (!createResult.success) {
        return {
          success: false,
          error: `Could not create virtual environment: ${createResult.error}`
        }
      }
    }

    const pythonPath =
      process.platform === 'win32'
        ? path.join(VENV_DIR, 'Scripts', 'python.exe')
        : path.join(VENV_DIR, 'bin', 'python')

    const pipPath =
      process.platform === 'win32'
        ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
        : path.join(VENV_DIR, 'bin', 'pip')

    let setupLog = []

    setupLog.push('Installing essential build tools...')

    try {
      await execCommand(`"${pythonPath}" -m pip install --upgrade pip setuptools wheel`)
      setupLog.push('Successfully installed essential build tools')
    } catch (error) {
      setupLog.push(`Warning: Failed to install build tools: ${error.message}`)
    }

    const requirements = fs.readFileSync(requirementsPath, 'utf8')
    const packageLines = requirements
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    setupLog.push(`Found ${packageLines.length} packages to install`)

    const scientificPackages = packageLines.filter(
      (line) =>
        line.startsWith('numpy') ||
        line.startsWith('scipy') ||
        line.startsWith('pandas') ||
        line.startsWith('matplotlib') ||
        line.startsWith('scikit-learn')
    )

    let installSuccess = false
    let installError = ''
    let installOutput = ''

    if (scientificPackages.length > 0) {
      setupLog.push('Strategy 1: Installing scientific packages with pre-compiled binaries...')
      try {
        for (const pkg of scientificPackages) {
          setupLog.push(`Installing ${pkg} with binary option...`)
          await execCommand(`"${pipPath}" install --only-binary=:all: ${pkg}`)
          setupLog.push(`Successfully installed ${pkg}`)
        }

        const remainingPackages = packageLines.filter((pkg) => !scientificPackages.includes(pkg))

        if (remainingPackages.length > 0) {
          setupLog.push(`Installing ${remainingPackages.length} remaining packages...`)

          await execCommand(`"${pipPath}" install ${remainingPackages.join(' ')}`)
          setupLog.push('Successfully installed all remaining packages')
        }

        installSuccess = true
      } catch (error) {
        setupLog.push(`Strategy 1 failed: ${error.message}`)
        installError = error.message
      }
    }

    if (!installSuccess) {
      setupLog.push('Strategy 2: Installing all packages with prefer-binary option...')
      try {
        await execCommand(`"${pipPath}" install --prefer-binary -r "${requirementsPath}"`)
        setupLog.push('Strategy 2 succeeded: All packages installed with prefer-binary option')
        installSuccess = true
      } catch (error) {
        setupLog.push(`Strategy 2 failed: ${error.message}`)
        installError = error.message
      }
    }

    if (!installSuccess) {
      setupLog.push('Strategy 3: Installing packages individually...')

      let successPackages = []
      let failedPackages = []

      for (const pkg of packageLines) {
        setupLog.push(`Installing ${pkg}...`)
        try {
          await execCommand(`"${pipPath}" install --prefer-binary ${pkg}`)
          successPackages.push(pkg)
          setupLog.push(`Successfully installed ${pkg}`)
        } catch (firstError) {
          try {
            setupLog.push(`Retrying ${pkg} without options...`)
            await execCommand(`"${pipPath}" install ${pkg}`)
            successPackages.push(pkg)
            setupLog.push(`Successfully installed ${pkg} without options`)
          } catch (secondError) {
            try {
              setupLog.push(`Trying ${pkg} with --no-deps flag...`)
              await execCommand(`"${pipPath}" install --no-deps ${pkg}`)
              successPackages.push(`${pkg} (without dependencies)`)
              setupLog.push(`Installed ${pkg} without dependencies`)
            } catch (thirdError) {
              failedPackages.push(pkg)
              setupLog.push(`Failed to install ${pkg}: ${thirdError.message}`)
            }
          }
        }
      }

      if (successPackages.length > 0) {
        setupLog.push(
          `Successfully installed ${successPackages.length} out of ${packageLines.length} packages`
        )
        installSuccess = true
        if (failedPackages.length > 0) {
          installError = `Failed to install ${failedPackages.length} package(s): ${failedPackages.join(', ')}`
        }
      } else {
        setupLog.push('Failed to install any packages')
        installSuccess = false
        installError = 'Could not install any packages using any strategy'
      }
    }

    installOutput = setupLog.join('\n')

    return {
      success: installSuccess,
      output: installOutput,
      error: installError,
      partial: installSuccess && installError !== ''
    }
  } catch (error) {
    console.error('Error in installation process:', error)
    return {
      success: false,
      error: `Installation process error: ${error.message}`,
      output: `An error occurred in the installation process: ${error.message}`
    }
  }
}

async function executePython(code, useVenv = true) {
  return new Promise((resolve, reject) => {
    let pythonCommand
    let pythonEnv = { ...process.env }

    if (useVenv) {
      pythonCommand = getVenvPythonPath()

      if (!fs.existsSync(pythonCommand)) {
        pythonCommand = process.platform === 'win32' ? 'python' : 'python3'
        console.log('Virtual environment Python not found, falling back to system Python')
      } else {
        if (process.platform === 'win32') {
          pythonEnv.PATH = `${path.dirname(pythonCommand)};${pythonEnv.PATH}`
          pythonEnv.VIRTUAL_ENV = VENV_DIR
        } else {
          pythonEnv.PATH = `${path.dirname(pythonCommand)}:${pythonEnv.PATH}`
          pythonEnv.VIRTUAL_ENV = VENV_DIR
        }
      }
    } else {
      pythonCommand = process.platform === 'win32' ? 'python' : 'python3'
    }

    console.log(`Using Python command: ${pythonCommand}`)

    const pythonProcess = spawn(pythonCommand, ['-u'], { env: pythonEnv })

    let output = ''
    let error = ''

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
    })

    pythonProcess.on('close', (exitCode) => {
      resolve({
        output,
        error,
        exitCode
      })
    })

    pythonProcess.on('error', (err) => {
      reject({
        message: `Failed to start Python: ${err.message}`,
        error: 'Could not start Python process. Is Python installed?'
      })
    })

    const timeout = setTimeout(() => {
      pythonProcess.kill()
      reject({
        message: 'Python execution timed out after 30 seconds',
        error: 'Execution timed out'
      })
    }, 30000)

    pythonProcess.on('close', () => {
      clearTimeout(timeout)
    })

    pythonProcess.stdin.write(code + '\n')

    setTimeout(() => {
      pythonProcess.stdin.write('\nexit()\n')
      pythonProcess.stdin.end()
    }, 1000)
  })
}

async function selectRequirementsFile() {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Requirements File', extensions: ['txt'] }],
      title: 'Select requirements.txt File'
    })

    if (canceled || filePaths.length === 0) {
      return {
        canceled: true
      }
    }

    const filePath = filePaths[0]
    const fileName = path.basename(filePath)

    return {
      canceled: false,
      filePath,
      fileName
    }
  } catch (error) {
    console.error('Error selecting requirements file:', error)
    return {
      error: error.message
    }
  }
}

function setupHandlers(ipcMain) {
  ipcMain.handle('checkPythonInstallation', async () => {
    try {
      return await checkPythonInstallation()
    } catch (error) {
      console.error('Error in checkPythonInstallation handler:', error)
      return { error: error.message }
    }
  })

  ipcMain.handle('checkVenvStatus', async () => {
    try {
      return await checkVenvExists()
    } catch (error) {
      console.error('Error in checkVenvStatus handler:', error)
      return { error: error.message }
    }
  })

  ipcMain.handle('createVenv', async () => {
    try {
      return await createVirtualEnvironment()
    } catch (error) {
      console.error('Error in createVenv handler:', error)
      return { error: error.message }
    }
  })

  ipcMain.handle('selectRequirementsFile', async () => {
    try {
      return await selectRequirementsFile()
    } catch (error) {
      console.error('Error in selectRequirementsFile handler:', error)
      return { error: error.message }
    }
  })

  ipcMain.handle('installRequirements', async (event, requirementsPath) => {
    try {
      return await installRequirements(requirementsPath)
    } catch (error) {
      console.error('Error in installRequirements handler:', error)
      return { error: error.message }
    }
  })

  ipcMain.handle('listInstalledPackages', async () => {
    try {
      return await listInstalledPackages()
    } catch (error) {
      console.error('Error in listInstalledPackages handler:', error)
      return {
        success: false,
        error: error.message,
        packages: []
      }
    }
  })

  ipcMain.handle('runPython', async (event, code, useVenv = true) => {
    try {
      return await executePython(code, useVenv)
    } catch (error) {
      console.error('Error in runPython handler:', error)
      return {
        error: error.message || 'Unknown error',
        output: ''
      }
    }
  })

  ipcMain.handle('export-to-zip', exportToZip)
  ipcMain.handle('select-backup-file', selectBackupFile)
  ipcMain.handle('validate-backup-zip', validateBackupZip)
  ipcMain.handle('import-from-backup-zip', importFromBackupZip)
}

function createWindow() {
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown Files', extensions: ['md'] }]
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

  setupHandlers(ipcMain)

  ensureAppDataDir()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
