import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // Add Python execution method
  runPython: (code, useVenv = true) => ipcRenderer.invoke('runPython', code, useVenv)
}

// Extended API with Python environment management
const extendedElectronAPI = {
  ...electronAPI,
  // Python code execution
  runPython: (code, useVenv = true) => ipcRenderer.invoke('runPython', code, useVenv),
  
  // Python environment management
  checkPythonInstallation: () => ipcRenderer.invoke('checkPythonInstallation'),
  checkVenvStatus: () => ipcRenderer.invoke('checkVenvStatus'),
  createVenv: () => ipcRenderer.invoke('createVenv'),
  selectRequirementsFile: () => ipcRenderer.invoke('selectRequirementsFile'),
  installRequirements: (requirementsPath) => ipcRenderer.invoke('installRequirements', requirementsPath),
  listInstalledPackages: () => ipcRenderer.invoke('listInstalledPackages')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', extendedElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = extendedElectronAPI
  window.api = api
}