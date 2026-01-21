import { ContactStatus, CallMode } from '../types';

export interface StatusStyleConfig {
  color: string; // Classes Tailwind pour le badge
  dot: string;   // Classe pour le point coloré
  label: string; // Libellé affiché
  visible: boolean; // Visibilité dans les sélecteurs
}

export type StatusKey = ContactStatus | string;
export type StatusConfigMap = Record<StatusKey, StatusStyleConfig>;

interface StatusConfigState {
  map: StatusConfigMap;
  order: string[];
}

type StatusConfigPerMode = Record<CallMode, StatusConfigState>;

// Nouveau stockage par mode
const STORAGE_KEY_V2 = 'dimicall-status-config-v2';
// Ancienne clé (pour migration)
const LEGACY_STORAGE_KEY = 'dimicall-status-config-v1';
// Clé du mode courant (utilisée ailleurs, dupliquée ici pour éviter les imports circulaires)
const MODE_STORAGE_KEY = 'dimicall-call-mode';

const DEFAULT_STATUS_ORDER: ContactStatus[] = [
  ContactStatus.NonDefini,
  ContactStatus.MauvaisNum,
  ContactStatus.Repondeur,
  ContactStatus.ARappeler,
  ContactStatus.PasInteresse,
  ContactStatus.Argumente,
  ContactStatus.D0,
  ContactStatus.R0,
  ContactStatus.ListeNoire,
  ContactStatus.Premature,
  ContactStatus.A0,
];

const DEFAULT_CONFIG: StatusConfigMap = {
  [ContactStatus.NonDefini]: { label: 'Non défini', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200', dot: 'bg-gray-400', visible: true },
  [ContactStatus.MauvaisNum]: { label: 'Mauvais num', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', dot: 'bg-red-500', visible: true },
  [ContactStatus.Repondeur]: { label: 'Répondeur', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200', dot: 'bg-orange-500', visible: true },
  [ContactStatus.ARappeler]: { label: 'À rappeler', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200', dot: 'bg-yellow-500', visible: true },
  [ContactStatus.PasInteresse]: { label: 'Pas intéressé', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', dot: 'bg-red-500', visible: true },
  [ContactStatus.Argumente]: { label: 'Argumenté', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200', dot: 'bg-blue-500', visible: true },
  [ContactStatus.D0]: { label: 'D0', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200', dot: 'bg-emerald-500', visible: true },
  [ContactStatus.R0]: { label: 'R0', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200', dot: 'bg-green-500', visible: true },
  [ContactStatus.ListeNoire]: { label: 'Liste noire', color: 'bg-gray-800 text-gray-100 border-gray-600 dark:bg-gray-700 dark:text-gray-100', dot: 'bg-gray-600', visible: true },
  [ContactStatus.Premature]: { label: 'Prématuré', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200', dot: 'bg-purple-500', visible: true },
  [ContactStatus.A0]: { label: 'A0', color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200', dot: 'bg-indigo-500', visible: true },
};

function getCurrentModeFromStorage(): CallMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY) as CallMode | null;
    return raw === CallMode.Apporteur ? CallMode.Apporteur : CallMode.Client;
  } catch {
    return CallMode.Client;
  }
}

export class StatusConfigService {
  // Cache pour éviter les logs répétitifs
  private static warnedStatuses = new Set<string>();

  private static mergeOrder(baseOrder: string[], keys: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    [...DEFAULT_STATUS_ORDER, ...baseOrder, ...keys].forEach((key) => {
      if (!keys.includes(key)) return;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(key);
    });
    // S'assurer qu'aucune clé valide ne manque
    keys.forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    });
    return result;
  }

  private static normalizeState(state?: Partial<StatusConfigState> | StatusConfigMap | null): StatusConfigState {
    // Support du format legacy (map directe)
    const mapSource = (state && 'map' in (state as any)) ? (state as any).map : state;
    const mergedMap: StatusConfigMap = { ...DEFAULT_CONFIG, ...(mapSource || {}) };
    const keys = Object.keys(mergedMap);
    const existingOrder = (state && 'order' in (state as any) && Array.isArray((state as any).order))
      ? ((state as any).order as string[])
      : [];
    // Migration forcée des status DO/RO vers D0/R0
    if (mergedMap['DO']) {
      mergedMap[ContactStatus.D0] = { ...mergedMap['DO'], label: 'D0' };
      delete mergedMap['DO'];
    }
    if (mergedMap['RO']) {
      mergedMap[ContactStatus.R0] = { ...mergedMap['RO'], label: 'R0' };
      delete mergedMap['RO'];
    }

    const cleanedOrder = this.mergeOrder(existingOrder, Object.keys(mergedMap))
      .map(s => s === 'DO' ? ContactStatus.D0 : s === 'RO' ? ContactStatus.R0 : s)
      .filter((s, i, arr) => arr.indexOf(s) === i); // Dedupe

    return {
      map: mergedMap,
      order: cleanedOrder,
    };
  }

  private static loadAll(): StatusConfigPerMode {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V2);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StatusConfigPerMode> | null;
        const client = this.normalizeState(parsed?.[CallMode.Client]);
        const apporteur = this.normalizeState(parsed?.[CallMode.Apporteur]);
        return { [CallMode.Client]: client, [CallMode.Apporteur]: apporteur } as StatusConfigPerMode;
      }

      // Migration depuis V1
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy) as StatusConfigMap;
        const migrated: StatusConfigPerMode = {
          [CallMode.Client]: this.normalizeState(parsedLegacy),
          [CallMode.Apporteur]: this.normalizeState(DEFAULT_CONFIG),
        } as StatusConfigPerMode;
        // Sauvegarder immédiatement au nouveau format
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
        return migrated;
      }

      // Par défaut si rien en storage
      const defaults: StatusConfigPerMode = {
        [CallMode.Client]: this.normalizeState(DEFAULT_CONFIG),
        [CallMode.Apporteur]: this.normalizeState(DEFAULT_CONFIG),
      } as StatusConfigPerMode;
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(defaults));
      return defaults;
    } catch {
      return {
        [CallMode.Client]: this.normalizeState(DEFAULT_CONFIG),
        [CallMode.Apporteur]: this.normalizeState(DEFAULT_CONFIG),
      } as StatusConfigPerMode;
    }
  }

  private static saveAll(all: StatusConfigPerMode) {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
    } catch { }
  }

  static getState(mode?: CallMode): StatusConfigState {
    const m = mode ?? getCurrentModeFromStorage();
    const all = this.loadAll();
    return this.normalizeState(all[m]);
  }

  static getConfig(mode?: CallMode): StatusConfigMap {
    return this.getState(mode).map;
  }

  static getStatusList(mode?: CallMode, options: { includeHidden?: boolean } = {}): string[] {
    const { includeHidden = false } = options;
    const state = this.getState(mode);
    const ordered = state.order.filter((status) => state.map[status]);
    if (includeHidden) return ordered;
    return ordered.filter((status) => state.map[status]?.visible !== false);
  }

  static saveConfig(config: StatusConfigMap, mode?: CallMode, order?: string[]) {
    const m = mode ?? getCurrentModeFromStorage();
    const all = this.loadAll();
    const current = this.getState(mode);
    const normalized = this.normalizeState({
      map: config,
      order: order ?? current.order,
    });
    const next = { ...all, [m]: normalized } as StatusConfigPerMode;
    this.saveAll(next);
    return normalized;
  }

  static addStatus(status: string, config: Partial<StatusStyleConfig>, mode?: CallMode): StatusConfigState {
    const trimmed = status.trim();
    if (!trimmed) return this.getState(mode);
    const current = this.getState(mode);
    const nextMap: StatusConfigMap = {
      ...current.map,
      [trimmed]: {
        label: config.label || trimmed,
        color: config.color || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200',
        dot: config.dot || 'bg-gray-400',
        visible: config.visible ?? true,
      },
    };
    const nextOrder = current.order.includes(trimmed) ? current.order : [...current.order, trimmed];
    return this.saveConfig(nextMap, mode, nextOrder);
  }

  static removeStatus(status: string, mode?: CallMode): StatusConfigState {
    const current = this.getState(mode);
    const nextMap = { ...current.map };
    delete nextMap[status];
    const nextOrder = current.order.filter((s) => s !== status);
    return this.saveConfig(nextMap, mode, nextOrder);
  }

  static getLabel(status: StatusKey, mode?: CallMode): string {
    const state = this.getState(mode);
    const fromConfig = state.map[status];
    if (fromConfig?.label) return fromConfig.label;
    const defaultConfig = DEFAULT_CONFIG[status as ContactStatus];
    if (defaultConfig) return defaultConfig.label;
    return typeof status === 'string' ? status : String(status);
  }

  static getColor(status: StatusKey, mode?: CallMode): { color: string; dot: string } {
    const state = this.getState(mode);
    const fromConfig = state.map[status];
    if (fromConfig) {
      return { color: fromConfig.color, dot: fromConfig.dot };
    }
    const defaultConfig = DEFAULT_CONFIG[status as ContactStatus];
    if (defaultConfig) {
      return { color: defaultConfig.color, dot: defaultConfig.dot };
    }

    // Statut totalement inconnu : couleur neutre
    if (!this.warnedStatuses.has(String(status))) {
      console.debug(`Statut non trouvé dans la configuration: ${status}`);
      this.warnedStatuses.add(String(status));
    }
    return {
      color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200',
      dot: 'bg-gray-400',
    };
  }

  static isVisible(status: StatusKey, mode?: CallMode): boolean {
    const state = this.getState(mode);
    const entry = state.map[status];
    if (entry) return entry.visible !== false;
    const defaultConfig = DEFAULT_CONFIG[status as ContactStatus];
    if (defaultConfig) return defaultConfig.visible !== false;
    return true;
  }

  /**
   * Réinitialise le cache des avertissements (utile pour les tests ou le debug)
   */
  static resetWarningCache(): void {
    this.warnedStatuses.clear();
  }

  static resetToDefaults(mode?: CallMode): StatusConfigState {
    const m = mode ?? getCurrentModeFromStorage();
    const all = this.loadAll();
    const defaults = this.normalizeState(DEFAULT_CONFIG);
    const next = { ...all, [m]: defaults } as StatusConfigPerMode;
    this.saveAll(next);
    return defaults;
  }
}

