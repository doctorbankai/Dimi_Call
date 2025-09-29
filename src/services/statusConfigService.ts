import { ContactStatus, CallMode } from '../types';

export interface StatusStyleConfig {
  color: string; // Tailwind class set for badge text/bg/border
  dot: string;   // Tailwind class for the small dot
  label: string; // Display label
  visible: boolean; // Visibility in pickers
}

export type StatusConfigMap = Record<ContactStatus, StatusStyleConfig>;

// Nouveau stockage par mode
const STORAGE_KEY_V2 = 'dimicall-status-config-v2';
// Ancienne clé (pour migration)
const LEGACY_STORAGE_KEY = 'dimicall-status-config-v1';
// Clé du mode courant (utilisée ailleurs, dupliquée ici pour éviter les imports circulaires)
const MODE_STORAGE_KEY = 'dimicall-call-mode';

const DEFAULT_CONFIG: StatusConfigMap = {
  [ContactStatus.NonDefini]: { label: 'Non défini', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200', dot: 'bg-gray-400', visible: true },
  [ContactStatus.MauvaisNum]: { label: 'Mauvais num', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', dot: 'bg-red-500', visible: true },
  [ContactStatus.Repondeur]: { label: 'Répondeur', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200', dot: 'bg-orange-500', visible: true },
  [ContactStatus.ARappeler]: { label: 'À rappeler', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200', dot: 'bg-yellow-500', visible: true },
  [ContactStatus.PasInteresse]: { label: 'Pas intéressé', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', dot: 'bg-red-500', visible: true },
  [ContactStatus.Argumente]: { label: 'Argumenté', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200', dot: 'bg-blue-500', visible: true },
  [ContactStatus.DO]: { label: 'DO', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200', dot: 'bg-emerald-500', visible: true },
  [ContactStatus.RO]: { label: 'RO', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200', dot: 'bg-green-500', visible: true },
  [ContactStatus.ListeNoire]: { label: 'Liste noire', color: 'bg-gray-800 text-gray-100 border-gray-600 dark:bg-gray-700 dark:text-gray-100', dot: 'bg-gray-600', visible: true },
  [ContactStatus.Premature]: { label: 'Prématuré', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200', dot: 'bg-purple-500', visible: true },
  [ContactStatus.A0]: { label: 'A0', color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200', dot: 'bg-indigo-500', visible: true },
};

type StatusConfigPerMode = Record<CallMode, StatusConfigMap>;

function getCurrentModeFromStorage(): CallMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY) as CallMode | null;
    return raw === CallMode.Mandataire ? CallMode.Mandataire : CallMode.Client;
  } catch {
    return CallMode.Client;
  }
}

export class StatusConfigService {
  // Cache pour éviter les logs répétitifs
  private static warnedStatuses = new Set<string>();
  
  private static loadAll(): StatusConfigPerMode {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V2);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StatusConfigPerMode> | null;
        const client = parsed?.[CallMode.Client] || { ...DEFAULT_CONFIG };
        const mandataire = parsed?.[CallMode.Mandataire] || { ...DEFAULT_CONFIG };
        return { [CallMode.Client]: client, [CallMode.Mandataire]: mandataire } as StatusConfigPerMode;
      }

      // Migration depuis V1
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy) as StatusConfigMap;
        const migrated: StatusConfigPerMode = {
          [CallMode.Client]: { ...DEFAULT_CONFIG, ...(parsedLegacy || {}) },
          [CallMode.Mandataire]: { ...DEFAULT_CONFIG },
        } as StatusConfigPerMode;
        // Sauvegarder immédiatement au nouveau format
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
        return migrated;
      }

      // Par défaut si rien en storage
      const defaults: StatusConfigPerMode = {
        [CallMode.Client]: { ...DEFAULT_CONFIG },
        [CallMode.Mandataire]: { ...DEFAULT_CONFIG },
      } as StatusConfigPerMode;
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(defaults));
      return defaults;
    } catch {
      return {
        [CallMode.Client]: { ...DEFAULT_CONFIG },
        [CallMode.Mandataire]: { ...DEFAULT_CONFIG },
      } as StatusConfigPerMode;
    }
  }

  private static saveAll(all: StatusConfigPerMode) {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
    } catch {}
  }

  static getConfig(mode?: CallMode): StatusConfigMap {
    const m = mode ?? getCurrentModeFromStorage();
    const all = this.loadAll();
    return all[m];
  }

  static saveConfig(config: StatusConfigMap, mode?: CallMode) {
    const m = mode ?? getCurrentModeFromStorage();
    const all = this.loadAll();
    const next = { ...all, [m]: config } as StatusConfigPerMode;
    this.saveAll(next);
  }

  static getLabel(status: ContactStatus, mode?: CallMode): string {
    const cfg = this.getConfig(mode);
    const defaultConfig = DEFAULT_CONFIG[status];
    
    // Vérification de sécurité pour éviter les erreurs si le statut n'existe pas
    if (!defaultConfig) {
      // Ne logger qu'une seule fois par statut pour éviter le spam
      if (!this.warnedStatuses.has(status)) {
        console.debug(`Statut non trouvé dans la configuration par défaut: ${status}`);
        this.warnedStatuses.add(status);
      }
      return status; // Retourner le statut tel quel si pas de configuration
    }
    
    return cfg[status]?.label ?? defaultConfig.label;
  }

  static getColor(status: ContactStatus, mode?: CallMode): { color: string; dot: string } {
    const cfg = this.getConfig(mode);
    const c = cfg[status];
    const defaultConfig = DEFAULT_CONFIG[status];
    
    // Vérification de sécurité pour éviter les erreurs si le statut n'existe pas
    if (!defaultConfig) {
      // Ne logger qu'une seule fois par statut pour éviter le spam
      if (!this.warnedStatuses.has(status)) {
        console.debug(`Statut non trouvé dans la configuration par défaut: ${status}`);
        this.warnedStatuses.add(status);
      }
      return { 
        color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200', 
        dot: 'bg-gray-400' 
      };
    }
    
    return { 
      color: c?.color || defaultConfig.color, 
      dot: c?.dot || defaultConfig.dot 
    };
  }

  static isVisible(status: ContactStatus, mode?: CallMode): boolean {
    const cfg = this.getConfig(mode);
    const defaultConfig = DEFAULT_CONFIG[status];
    
    // Vérification de sécurité pour éviter les erreurs si le statut n'existe pas
    if (!defaultConfig) {
      // Ne logger qu'une seule fois par statut pour éviter le spam
      if (!this.warnedStatuses.has(status)) {
        console.debug(`Statut non trouvé dans la configuration par défaut: ${status}`);
        this.warnedStatuses.add(status);
      }
      return true; // Par défaut visible si pas de configuration
    }
    
    return cfg[status]?.visible !== false;
  }

  /**
   * Réinitialise le cache des avertissements (utile pour les tests ou le debug)
   */
  static resetWarningCache(): void {
    this.warnedStatuses.clear();
  }
}


