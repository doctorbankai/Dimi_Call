/**
 * Configuration centralisée pour la gestion des logs
 * Permet de contrôler finement les niveaux de logging par catégorie
 */

export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug';

export interface LogConfig {
  enableDebugLogs: boolean;
  enableVerboseLogs: boolean;
  enablePerformanceLogs: boolean;
  logLevels: {
    adb: LogLevel;
    contacts: LogLevel;
    components: LogLevel;
    general: LogLevel;
    supabase: LogLevel;
    import: LogLevel;
  };
}

const STORAGE_KEY = 'dimicall-log-config';

// Configuration par défaut (production-ready)
export const DEFAULT_LOG_CONFIG: LogConfig = {
  enableDebugLogs: import.meta.env.DEV,
  enableVerboseLogs: false,
  enablePerformanceLogs: false,
  logLevels: {
    adb: import.meta.env.DEV ? 'info' : 'error',
    contacts: import.meta.env.DEV ? 'warn' : 'error',
    components: 'error',
    general: 'warn',
    supabase: import.meta.env.DEV ? 'warn' : 'error',
    import: import.meta.env.DEV ? 'info' : 'error',
  }
};

class LogConfigService {
  private config: LogConfig = DEFAULT_LOG_CONFIG;
  private listeners: Set<(config: LogConfig) => void> = new Set();

  constructor() {
    this.loadConfig();
  }

  /**
   * Charge la configuration depuis le localStorage
   */
  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...DEFAULT_LOG_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load log config, using defaults');
      this.config = DEFAULT_LOG_CONFIG;
    }
  }

  /**
   * Sauvegarde la configuration dans le localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to save log config');
    }
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  /**
   * Vérifie si un log doit être affiché selon le niveau
   */
  shouldLog(category: keyof LogConfig['logLevels'], level: Exclude<LogLevel, 'off'>): boolean {
    const categoryLevel = this.config.logLevels[category];
    if (categoryLevel === 'off') return false;

    const levelHierarchy: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const categoryIndex = levelHierarchy.indexOf(categoryLevel);
    const messageIndex = levelHierarchy.indexOf(level);

    return messageIndex >= categoryIndex;
  }

  /**
   * Ajoute un listener pour les changements de configuration
   */
  addListener(callback: (config: LogConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifie tous les listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.warn('Error in log config listener:', error);
      }
    });
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   */
  reset(): void {
    this.config = { ...DEFAULT_LOG_CONFIG };
    this.saveConfig();
  }
}

export const logConfigService = new LogConfigService();
