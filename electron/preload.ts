import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { DesktopNotificationPayload } from '../src/notifications/types'

// Interface personnalisée pour l'API exposée au renderer
interface ElectronAPI {
  // APIs de fenêtre
  closeApp: () => Promise<void>
  minimizeApp: () => Promise<void>
  maximizeApp: () => Promise<void>
  isMaximized: () => Promise<boolean>
  
  // APIs système
  platform: string
  
  // APIs de notification
  showNotification: (payload: DesktopNotificationPayload) => Promise<boolean>
  
  // APIs IPC pour les événements entrants
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void
    removeListener: (channel: string, listener: (...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
  }
  
  // APIs ADB
  adb: {
    getDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>
    executeShell: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>
    makeCall: (phoneNumber: string) => Promise<{ success: boolean; message?: string; error?: string }>
    endCall: () => Promise<{ success: boolean; message?: string; error?: string }>
    sendSms: (phoneNumber: string, message: string) => Promise<{ success: boolean; message?: string; error?: string }>
    getBattery: () => Promise<{ success: boolean; level?: number; isCharging?: boolean; error?: string }>
    restartServer: () => Promise<{ success: boolean; message?: string; error?: string }>
    killServer: () => Promise<{ success: boolean; message?: string; error?: string }>
    startServer: () => Promise<{ success: boolean; message?: string; error?: string }>
    cleanAuthKeys: () => Promise<{ success: boolean; message?: string; error?: string; deletedFiles?: string[] }>
  }
  
  // APIs DevTools
  devTools: {
    enable: () => Promise<{ success: boolean; error?: string }>
    disable: () => Promise<{ success: boolean; error?: string }>
    isEnabled: () => Promise<{ enabled: boolean }>
  }
  
  // API pour obtenir la version de l'app
  getAppVersion: () => Promise<string>
  // API pour forcer la vérification manuelle des mises à jour
  checkForUpdates: (betaEnabled?: boolean, forceRefresh?: boolean) => Promise<{ status: string; message: string }>
  
  // APIs pour la gestion des mises à jour
  getUpdateStatus: () => Promise<{ updateAvailable: boolean; updateDownloaded: boolean; updateInfo: any }>
  installUpdate: () => Promise<{ success: boolean; message?: string }>
  revertToStable: () => Promise<{ success: boolean; message?: string }>
  
  // API pour synchroniser les préférences beta
  syncBetaPreferences: (preferences: any) => Promise<{ success: boolean; message?: string }>
  
  // Écouter les événements de mise à jour
  onUpdateChecking: (callback: () => void) => void
  onUpdateAvailable: (callback: (updateInfo: any) => void) => void
  onUpdateNotAvailable: (callback: (updateInfo: any) => void) => void
  onUpdateError: (callback: (error: string) => void) => void
  onUpdateDownloadProgress: (callback: (progress: any) => void) => void
  onUpdateDownloaded: (callback: (updateInfo: any) => void) => void

  // APIs Local DB (SQLite)
  localdb: {
    insertStatus: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>
    listStatus: (startDate?: string, endDate?: string) => Promise<{ success: boolean; data?: any; error?: string }>
    getAll: () => Promise<{ success: boolean; data?: any; error?: string }>
    getPath: () => Promise<{ success: boolean; data?: string | null }>
    exportCsv: () => Promise<{ success: boolean; path?: string; error?: string }>
    importCsv: () => Promise<{ success: boolean; count?: number; error?: string }>
  }

  // APIs File Manager
  listDirectory: (path: string) => Promise<any>
  createFolder: (path: string, name: string) => Promise<any>
  deleteItem: (path: string) => Promise<any>
  renameItem: (path: string, newName: string) => Promise<any>
  copyItem: (source: string, destination: string) => Promise<any>
  moveItem: (source: string, destination: string) => Promise<any>
  uploadFiles: (files: Array<{ name: string; data: Buffer; path: string }>, destination: string) => Promise<any>
  openLocation: (path: string) => Promise<{ success: boolean; error?: string }>
  getFileInfo: (path: string) => Promise<any>
  getFileById: (fileId: string) => Promise<{ success: boolean; file?: any; error?: any }>
  
  // File operations
  files: {
    openFile: (path: string) => Promise<{ success: boolean; error?: string }>
    showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
  }
}

// API personnalisée à exposer dans la sandbox du navigateur
const electronAPI: ElectronAPI = {
  // APIs de fenêtre
  closeApp: () => ipcRenderer.invoke('app:close'),
  minimizeApp: () => ipcRenderer.invoke('app:minimize'),
  maximizeApp: () => ipcRenderer.invoke('app:maximize'),
  isMaximized: () => ipcRenderer.invoke('app:is-maximized'),
  
  // APIs système
  platform: process.platform,
  
  // APIs de notification
  showNotification: async (payload: DesktopNotificationPayload) => {
    try {
      const result = await ipcRenderer.invoke('notifications:show', payload);
      if (result && typeof result === 'object' && 'success' in result) {
        return Boolean((result as { success?: boolean }).success);
      }
      if (typeof result === 'boolean') {
        return result;
      }
    } catch (error) {
      console.error('[preload] notifications:show failed', error);
    }

    if (typeof Notification === 'undefined') {
      return false;
    }

    if (Notification.permission === 'granted') {
      new Notification(payload.title, { body: payload.body, tag: payload.tag });
      return true;
    }

    if (Notification.permission !== 'denied' && Notification.requestPermission) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(payload.title, { body: payload.body, tag: payload.tag });
          return true;
        }
      } catch (error) {
        console.error('[preload] notification permission request failed', error);
      }
    }

    return false;
  },
  
  // APIs IPC pour les événements entrants (exposer seulement les canaux sécurisés)
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      // Seulement autoriser les canaux sécurisés prédéfinis
      const validChannels = ['global-fn-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, listener);
      }
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      const validChannels = ['global-fn-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener);
      }
    },
    removeAllListeners: (channel: string) => {
      const validChannels = ['global-fn-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  },
  
  // APIs ADB
  adb: {
    getDevices: () => ipcRenderer.invoke('adb:devices'),
    executeShell: (command: string) => ipcRenderer.invoke('adb:shell', command),
    makeCall: (phoneNumber: string) => ipcRenderer.invoke('adb:call', phoneNumber),
    endCall: () => ipcRenderer.invoke('adb:end-call'),
    sendSms: (phoneNumber: string, message: string) => ipcRenderer.invoke('adb:send-sms', phoneNumber, message),
    getBattery: () => ipcRenderer.invoke('adb:battery'),
    restartServer: () => ipcRenderer.invoke('adb:restart-server'),
    killServer: () => ipcRenderer.invoke('adb:kill-server'),
    startServer: () => ipcRenderer.invoke('adb:start-server'),
    cleanAuthKeys: () => ipcRenderer.invoke('adb:clean-auth-keys')
  },
  
  // APIs DevTools
  devTools: {
    enable: () => ipcRenderer.invoke('devtools:enable'),
    disable: () => ipcRenderer.invoke('devtools:disable'),
    isEnabled: () => ipcRenderer.invoke('devtools:is-enabled')
  },
  
  // API pour obtenir la version de l'app
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Vérification manuelle
  checkForUpdates: (betaEnabled?: boolean, forceRefresh?: boolean) => ipcRenderer.invoke('check-for-updates', betaEnabled, forceRefresh),
  
  // APIs pour la gestion des mises à jour
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  revertToStable: () => ipcRenderer.invoke('revert-to-stable'),
  // Ouvrir l'emplacement d'un fichier
  showItemInFolder: (targetPath: string) => ipcRenderer.invoke('os:show-item-in-folder', targetPath),
  getDownloadsPath: () => ipcRenderer.invoke('os:get-downloads-path'),
  openDownloadsFolder: () => ipcRenderer.invoke('os:open-downloads-folder'),
  
  // API pour synchroniser les préférences beta
  syncBetaPreferences: (preferences: any) => ipcRenderer.invoke('sync-beta-preferences', preferences),
  
  // Écouter les événements de mise à jour
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback)
  },
  onUpdateAvailable: (callback: (updateInfo: any) => void) => {
    ipcRenderer.on('update-available', (event, updateInfo) => callback(updateInfo))
  },
  onUpdateNotAvailable: (callback: (updateInfo: any) => void) => {
    ipcRenderer.on('update-not-available', (event, updateInfo) => callback(updateInfo))
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (event, error) => callback(error))
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: (updateInfo: any) => void) => {
    ipcRenderer.on('update-downloaded', (event, updateInfo) => callback(updateInfo))
  },

  // APIs Local DB (SQLite)
  localdb: {
    insertStatus: (payload: any) => ipcRenderer.invoke('localdb:insert-status', payload),
    listStatus: (startDate?: string, endDate?: string) => ipcRenderer.invoke('localdb:list-status', startDate, endDate),
    getAll: () => ipcRenderer.invoke('localdb:get-all'),
    getPath: () => ipcRenderer.invoke('localdb:path'),
    exportCsv: () => ipcRenderer.invoke('localdb:export-csv'),
    importCsv: () => ipcRenderer.invoke('localdb:import-csv'),
    exportXlsx: () => ipcRenderer.invoke('localdb:export-xlsx'),
    importXlsx: () => ipcRenderer.invoke('localdb:import-xlsx'),
    delete: (id: number) => ipcRenderer.invoke('localdb:delete', id),
    update: (payload: any) => ipcRenderer.invoke('localdb:update', payload),
    updateLatestForContact: (contactId: string, fields: any) => ipcRenderer.invoke('localdb:update-latest-for-contact', contactId, fields),
  },

  // APIs File Manager
  listDirectory: (path: string) => ipcRenderer.invoke('file:list-directory', path),
  createFolder: (path: string, name: string) => ipcRenderer.invoke('file:create-folder', path, name),
  deleteItem: (path: string) => ipcRenderer.invoke('file:delete-item', path),
  renameItem: (path: string, newName: string) => ipcRenderer.invoke('file:rename-item', path, newName),
  copyItem: (source: string, destination: string) => ipcRenderer.invoke('file:copy-item', source, destination),
  moveItem: (source: string, destination: string) => ipcRenderer.invoke('file:move-item', source, destination),
  uploadFiles: (files: Array<{ name: string; data: Buffer; path: string }>, destination: string) => ipcRenderer.invoke('file:upload-files', files, destination),
  openLocation: (path: string) => ipcRenderer.invoke('file:open-location', path),
  getFileInfo: (path: string) => ipcRenderer.invoke('file:get-file-info', path),
  getFileById: (fileId: string) => ipcRenderer.invoke('file:get-file-by-id', fileId),
  
  // File operations
  files: {
    openFile: (path: string) => ipcRenderer.invoke('file:open-file', path),
    showInFolder: (path: string) => ipcRenderer.invoke('file:show-in-folder', path),
  },
}

// Utiliser `contextBridge` APIs pour exposer Electron APIs au
// renderer seulement si le context isolation est activé, sinon
// juste ajouter au DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = electronAPI
}

// Types pour TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 
