export enum Theme {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

export enum CallMode {
  Client = 'client',
  Mandataire = 'mandataire',
}

export enum ContactStatus {
  NonDefini = "Non défini",
  MauvaisNum = "Mauvais num",
  Repondeur = "Répondeur",
  ARappeler = "À rappeler",
  PasInteresse = "Pas intéressé",
  Argumente = "Argumenté",
  DO = "DO",
  RO = "RO",
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
  getAppVersion: () => Promise<string>;
  checkForUpdates: (includeBeta?: boolean) => Promise<{ status: string; message?: string }>;
  getUpdateStatus: () => Promise<{ updateAvailable: boolean; updateDownloaded: boolean; updateInfo: any }>;
  installUpdate: () => Promise<{ success: boolean; message?: string }>;
  revertToStable: () => Promise<{ success: boolean; message?: string }>;
  enableDevTools: () => void;
  disableDevTools: () => void;
  isDevToolsEnabled: () => boolean;
  onUpdateChecking: (callback: () => void) => void;
  onUpdateAvailable: (callback: (updateInfo: any) => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;
  onUpdateDownloadProgress: (callback: (progress: { percent: number }) => void) => void;
  onUpdateDownloaded: (callback: (updateInfo: any) => void) => void;
}

export interface Window {
  // ... existing code ...
}
