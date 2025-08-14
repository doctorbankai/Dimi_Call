/**
 * Types pour le système de mise à jour automatique
 * Includes platform-specific update configuration and manual update information
 */

/**
 * Préférences utilisateur pour les versions bêta
 */
export interface BetaPreferences {
  /** Indique si l'utilisateur a opté pour les versions bêta */
  enabled: boolean;
  /** Timestamp de la dernière modification des préférences */
  lastModified: number;
  /** Indique si l'utilisateur a été averti des risques */
  hasBeenWarned: boolean;
}

/**
 * Informations sur une mise à jour disponible
 */
export interface UpdateInfo {
  /** Version de la mise à jour */
  version: string;
  /** Date de publication de la mise à jour */
  releaseDate?: string;
  /** Nom de la version */
  releaseName?: string;
  /** Notes de version */
  releaseNotes?: string;
  /** Indique si c'est une version bêta */
  isBeta?: boolean;
  /** Indique si c'est une pre-release GitHub */
  isPrerelease?: boolean;
}

/**
 * État actuel du système de mise à jour
 */
export interface UpdateState {
  /** Indique si une vérification de mise à jour est en cours */
  checking: boolean;
  /** Indique si une mise à jour est disponible */
  available: boolean;
  /** Indique si une mise à jour est en cours de téléchargement */
  downloading: boolean;
  /** Indique si une mise à jour a été téléchargée et est prête à être installée */
  downloaded: boolean;
  /** Message d'erreur en cas de problème */
  error: string | null;
  /** Progression du téléchargement (0-100) */
  progress: number;
  /** Informations détaillées sur la mise à jour */
  updateInfo: UpdateInfo | null;
  /** Indique si les mises à jour sont activées pour cette plateforme */
  enabled: boolean;
}

/**
 * Props pour le composant UpdateConfirmationDialog
 */
export interface UpdateConfirmationDialogProps {
  /** Indique si le dialog est ouvert */
  isOpen: boolean;
  /** Fonction appelée pour fermer le dialog */
  onClose: () => void;
  /** Fonction appelée quand l'utilisateur confirme la mise à jour */
  onConfirm: () => void;
  /** Informations sur la mise à jour à afficher */
  updateInfo?: UpdateInfo | null;
}

/**
 * Informations pour les mises à jour manuelles (quand les mises à jour automatiques sont désactivées)
 */
export interface ManualUpdateInfo {
  /** URL pour télécharger la mise à jour manuellement */
  url: string;
  /** Message informatif pour l'utilisateur */
  message: string;
  /** Plateforme concernée */
  platform: string;
  /** Version actuelle de l'application */
  version: string;
}

/**
 * Résultat du hook useAutoUpdate
 */
export interface UseAutoUpdateResult {
  /** État actuel de la mise à jour */
  updateState: UpdateState;
  /** Fonction pour vérifier manuellement les mises à jour */
  checkForUpdates: () => Promise<void>;
  /** Fonction pour installer une mise à jour téléchargée */
  installUpdate: () => Promise<void>;
  /** Préférences bêta de l'utilisateur */
  betaPreferences: BetaPreferences;
  /** Fonction pour mettre à jour les préférences bêta */
  setBetaPreferences: (preferences: BetaPreferences) => void;
  /** Fonction pour revenir à la version stable */
  revertToStable: () => Promise<void>;
  /** Indique si les mises à jour sont activées pour cette plateforme */
  isUpdateEnabled: boolean;
  /** Informations pour les mises à jour manuelles (si les mises à jour automatiques sont désactivées) */
  manualUpdateInfo: ManualUpdateInfo | null;
}