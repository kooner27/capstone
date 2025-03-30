import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  runPython: (code, useVenv = true) => ipcRenderer.invoke('runPython', code, useVenv)
}

const extendedElectronAPI = {
  ...electronAPI,

  runPython: (code, useVenv = true) => ipcRenderer.invoke('runPython', code, useVenv),

  checkPythonInstallation: () => ipcRenderer.invoke('checkPythonInstallation'),
  checkVenvStatus: () => ipcRenderer.invoke('checkVenvStatus'),
  createVenv: () => ipcRenderer.invoke('createVenv'),
  selectRequirementsFile: () => ipcRenderer.invoke('selectRequirementsFile'),
  installRequirements: (requirementsPath) =>
    ipcRenderer.invoke('installRequirements', requirementsPath),
  listInstalledPackages: () => ipcRenderer.invoke('listInstalledPackages'),

  exportToZip: (data) => ipcRenderer.invoke('export-to-zip', data),
  selectBackupFile: () => ipcRenderer.invoke('select-backup-file'),
  validateBackupZip: (filePath) => ipcRenderer.invoke('validate-backup-zip', filePath),
  importFromBackupZip: () => ipcRenderer.invoke('import-from-backup-zip')
}

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
