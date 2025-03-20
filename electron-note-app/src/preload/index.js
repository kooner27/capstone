import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // Add Python execution method
  runPython: (code) => ipcRenderer.invoke('run-python', code)
}

// Add runPython to electronAPI
const extendedElectronAPI = {
  ...electronAPI,
  runPython: (code) => ipcRenderer.invoke('run-python', code)
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