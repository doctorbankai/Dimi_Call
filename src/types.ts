import type { DesktopNotificationPayload } from "@/notifications/types";

export enum Theme {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

export enum CallMode {
  Client = 'client',
  Apporteur = 'apporteur',
}

export enum ContactStatus {
  NonDefini = "Non défini",
  MauvaisNum = "Mauvais num",
  Repondeur = "Répondeur",
  ARappeler = "À rappeler",
  PasInteresse = "Pas intéressé",
  Argumente = "Argumenté",
  D0 = "D0",
  R0 = "R0",
  ListeNoire = "Liste noire",
  Premature = "Prématuré",
  A0 = "A0",
}

export interface Contact {
  id: string; // Unique ID, e.g., generated or from data source
  numeroLigne: number;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  source: string; // 'source' in Python app (formerly 'ecole')
  statut: ContactStatus;
  commentaire: string;
  dateRappel: string; // YYYY-MM-DD
  heureRappel: string; // HH:mm
  dateRDV: string; // YYYY-MM-DD
  heureRDV: string; // HH:mm
  dateAppel: string; // YYYY-MM-DD
  heureAppel: string; // HH:mm
  dureeAppel: string; // mm:ss
  lien?: string; // URL du lien internet associé au contact
  sexe?: string;
  don?: string;
  qualite?: string;
  type?: string;
  date?: string; // General date field
  uid?: string; // New UID field
  uid_supabase?: string; // For potential future Supabase integration mapping
  utilisateur?: string; // Nom complet de l'utilisateur connecté
  actions?: string; // Actions field for import purposes
  // Nouveaux champs pour les itérations Supabase
  statutAppel?: string; // Statut des appels (statut_appel_X)
  statutRDV?: string; // Statut des RDV (statut_r*_*)
  commentaireRDV?: string; // Commentaires des RDV (commentaires_r*_*)
}

export interface CallState {
  isCalling?: boolean;
  hasBeenCalled?: boolean;
}

export type CallStates = Record<string, CallState>; // Contact ID to CallState

export interface ClientFile {
  id: string;
  name: string;
  size: string; // e.g., "1.2 MB"
  date: string; // e.g., "12/07/2024"
  type: 'pdf' | 'doc' | 'xls' | 'img' | 'other';
}

// For Gemini
export enum EmailType {
  D0Visio = "d0_visio",
  R0Interne = "r0_interne",
  R0Externe = "r0_externe",
  PremierContact = "premier_contact",
}

export enum SmsType {
  D0Visio = "d0_visio",
  R0Interne = "r0_interne",
  R0Externe = "r0_externe",
  PremierContact = "premier_contact",
}

export enum Civility {
  Monsieur = "monsieur",
  Madame = "madame",
}

export enum QualificationStatutMarital {
    Marie = "Marié",
    Pacse = "Pacsé",
    Celibataire = "Célibataire",
    Concubinage = "En concubinage",
    Veuf = "Veuf",
}

export enum QualificationSituationPro {
    CDD = "CDD",
    CDI = "CDI",
    ChefEntreprise = "Chef d'entreprise",
    Freelance = "Freelance",
    VIEVIA = "VIE/VIA",
    Chomeur = "Chômeur",
    Retraite = "Retraité",
    Etudiant = "Étudiant",
}

export interface ElectronAPI {
  // APIs de fenêtre
  closeApp: () => Promise<void>;
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  
  // APIs système
  platform: string;
  
  // APIs de notification
  showNotification: (payload: DesktopNotificationPayload) => Promise<boolean>;
  
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

  // APIs File Manager
  files?: {
    openFile: (path: string) => Promise<{ success: boolean; error?: string }>;
    showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
  };
  
  // File operations
  listDirectory?: (path: string) => Promise<any>;
  createFolder?: (path: string, name: string) => Promise<any>;
  getFileById?: (fileId: string) => Promise<{ success: boolean; file?: any; error?: any }>;
}

// Type pour le mode de recherche automatique
export type AutoSearchMode = 'disabled' | 'linkedin' | 'linkedin-name' | 'linkedin-name-type' | 'google' | 'link';

// Déclaration globale pour window.electron
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
