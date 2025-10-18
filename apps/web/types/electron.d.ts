// Déclaration des types pour l'API Electron exposée via contextBridge

export interface ElectronAPI {
  // APIs de fenêtre
  closeApp: () => Promise<void>;
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  
  // APIs système
  platform: string;
  
  // APIs de notification
  showNotification: (title: string, body: string) => void;
  
  // APIs IPC pour les événements entrants
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
  
  // APIs ADB
  adb: {
    getDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>;
    executeShell: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>;
    makeCall: (phoneNumber: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    endCall: () => Promise<{ success: boolean; message?: string; error?: string }>;
    sendSms: (phoneNumber: string, message: string) => Promise<{ success: boolean; message?: string; error?: string; warning?: string }>;
    getBattery: () => Promise<{ success: boolean; level?: number; isCharging?: boolean; error?: string }>;
    restartServer: () => Promise<{ success: boolean; message?: string; error?: string }>;
    killServer: () => Promise<{ success: boolean; message?: string; error?: string }>;
    startServer: () => Promise<{ success: boolean; message?: string; error?: string }>;
    cleanAuthKeys: () => Promise<{ success: boolean; message?: string; error?: string; deletedFiles?: string[] }>;
  };
  
  // APIs DevTools
  devTools: {
    enable: () => Promise<{ success: boolean; error?: string }>;
    disable: () => Promise<{ success: boolean; error?: string }>;
    isEnabled: () => Promise<{ enabled: boolean }>;
  };
  
  // API pour obtenir la version de l'app
  getAppVersion: () => Promise<string>;
  // API pour forcer la vérification manuelle des mises à jour
  checkForUpdates: (betaEnabled?: boolean, forceRefresh?: boolean) => Promise<{ status: string; message: string }>;
  
  // APIs pour la gestion des mises à jour
  getUpdateStatus: () => Promise<{ updateAvailable: boolean; updateDownloaded: boolean; updateInfo: any }>;
  installUpdate: () => Promise<{ success: boolean; message?: string }>;
  revertToStable: () => Promise<{ success: boolean; message?: string }>;
  
  // API pour synchroniser les préférences beta
  syncBetaPreferences: (preferences: any) => Promise<{ success: boolean; message?: string }>;
  
  // Écouter les événements de mise à jour
  onUpdateChecking: (callback: () => void) => void;
  onUpdateAvailable: (callback: (updateInfo: any) => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;
  onUpdateDownloadProgress: (callback: (progress: { percent: number }) => void) => void;
  onUpdateDownloaded: (callback: (updateInfo: any) => void) => void;

  // APIs Local DB (SQLite)
  localdb: {
    insertStatus: (payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    listStatus: (startDate?: string, endDate?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getAll: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getPath: () => Promise<{ success: boolean; data?: string | null }>;
    exportCsv: () => Promise<{ success: boolean; path?: string; error?: string }>;
    importCsv: () => Promise<{ success: boolean; count?: number; error?: string }>;
  };
}

// Déclaration globale pour window.electron
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
