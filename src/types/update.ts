/**
 * Types pour le système de mise à jour automatique
 */

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
 * Résultat du hook useAutoUpdate
 */
export interface UseAutoUpdateResult {
  /** État actuel de la mise à jour */
  updateState: UpdateState;
  /** Fonction pour vérifier manuellement les mises à jour */
  checkForUpdates: () => Promise<void>;
  /** Fonction pour installer une mise à jour téléchargée */
  installUpdate: () => Promise<void>;
}