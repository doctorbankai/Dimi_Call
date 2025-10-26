/**
 * Service de gestion des logs pour l'interface utilisateur
 */

import { logConfigService, type LogConfig } from './logConfig';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  source: string;
  stack?: string;
  metadata?: any;
}

export interface LogsFilter {
  levels: ('error' | 'warn' | 'info' | 'debug')[];
  timeRange?: {
    start: number;
    end: number;
  };
  searchTerm?: string;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogCategory = keyof LogConfig['logLevels'];

const STORAGE_KEY = 'dimicall-logs';
const MAX_LOGS = 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 heures

class LogsServiceClass {
  private logs: LogEntry[] = [];
  private isCapturing = false;
  private originalConsole: any = {};
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    // Ne pas capturer automatiquement les console.log pour éviter les logs excessifs
    // this.startCapturing();
  }

  /**
   * Génère un ID unique pour un log
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ajoute un log à la collection
   */
  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
    try {
      // Vérifier si le log doit être affiché selon la configuration
      const category = this.getCategoryFromSource(entry.source);
      if (!logConfigService.shouldLog(category, entry.level)) {
        return; // Skip ce log
      }

      const logEntry: LogEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        ...entry
      };

      // Filtrer les données sensibles
      logEntry.message = this.sanitizeMessage(logEntry.message);

      this.logs.unshift(logEntry); // Ajouter au début pour avoir les plus récents en premier
      
      // Rotation automatique
      this.rotateLogs();
      
      // Notifier les listeners
      this.notifyListeners();
      
      // Sauvegarder périodiquement
      this.saveToStorage();
    } catch (error) {
      // Fallback silencieux pour éviter les boucles infinies
      console.warn('Failed to add log entry:', error);
    }
  }

  /**
   * Détermine la catégorie de log à partir de la source
   */
  private getCategoryFromSource(source: string): LogCategory {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('adb')) return 'adb';
    if (sourceLower.includes('contact')) return 'contacts';
    if (sourceLower.includes('component')) return 'components';
    if (sourceLower.includes('supabase')) return 'supabase';
    if (sourceLower.includes('import')) return 'import';
    return 'general';
  }

  /**
   * Méthodes de logging spécialisées par catégorie
   */
  logADB(level: LogLevel, message: string, metadata?: any): void {
    if (logConfigService.shouldLog('adb', level)) {
      this.addLog({ level, message: `[ADB] ${message}`, source: 'adb', metadata });
    }
  }

  logContacts(level: LogLevel, message: string, metadata?: any): void {
    if (logConfigService.shouldLog('contacts', level)) {
      this.addLog({ level, message: `[CONTACTS] ${message}`, source: 'contacts', metadata });
    }
  }

  logComponents(level: LogLevel, message: string, metadata?: any): void {
    if (logConfigService.shouldLog('components', level)) {
      this.addLog({ level, message: `[COMPONENTS] ${message}`, source: 'components', metadata });
    }
  }

  logSupabase(level: LogLevel, message: string, metadata?: any): void {
    if (logConfigService.shouldLog('supabase', level)) {
      this.addLog({ level, message: `[SUPABASE] ${message}`, source: 'supabase', metadata });
    }
  }

  logImport(level: LogLevel, message: string, metadata?: any): void {
    if (logConfigService.shouldLog('import', level)) {
      this.addLog({ level, message: `[IMPORT] ${message}`, source: 'import', metadata });
    }
  }

  /**
   * Met à jour la configuration des logs
   */
  updateConfig(newConfig: Partial<LogConfig>): void {
    logConfigService.updateConfig(newConfig);
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): LogConfig {
    return logConfigService.getConfig();
  }

  /**
   * Récupère les logs avec filtrage optionnel
   */
  getLogs(filter?: LogsFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      // Filtrer par niveau
      if (filter.levels && filter.levels.length > 0) {
        filteredLogs = filteredLogs.filter(log => filter.levels.includes(log.level));
      }

      // Filtrer par plage de temps
      if (filter.timeRange) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= filter.timeRange!.start && 
          log.timestamp <= filter.timeRange!.end
        );
      }

      // Filtrer par terme de recherche
      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.message.toLowerCase().includes(searchTerm) ||
          log.source.toLowerCase().includes(searchTerm)
        );
      }
    }

    return filteredLogs;
  }

  /**
   * Vide tous les logs
   */
  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
    this.saveToStorage();
  }

  /**
   * Exporte les logs dans le format spécifié
   */
  exportLogs(format: 'text' | 'json' = 'text'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // Format texte
    return this.logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = log.level.toUpperCase().padEnd(5);
      const source = log.source.padEnd(10);
      let output = `[${timestamp}] ${level} ${source} ${log.message}`;
      
      if (log.stack) {
        output += `\n${log.stack}`;
      }
      
      return output;
    }).join('\n');
  }

  /**
   * Retourne le nombre total de logs
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Vérifie si la capture est active
   */
  isCapturingLogs(): boolean {
    return this.isCapturing;
  }

  /**
   * Démarre la capture des logs console
   */
  startCapturing(): void {
    if (this.isCapturing) return;

    // Sauvegarder les méthodes console originales
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Override des méthodes console
    const levels: (keyof typeof this.originalConsole)[] = ['log', 'error', 'warn', 'info', 'debug'];
    
    levels.forEach(level => {
      console[level] = (...args: any[]) => {
        // Appeler la méthode originale
        this.originalConsole[level](...args);
        
        // Capturer pour notre service
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');

        this.addLog({
          level: level === 'log' ? 'info' : level as LogLevel,
          message,
          source: 'console'
        });
      };
    });

    // Capturer les erreurs non gérées
    window.addEventListener('error', (event) => {
      this.addLog({
        level: 'error',
        message: `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
        source: 'window.error',
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addLog({
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        source: 'promise',
        stack: event.reason?.stack
      });
    });

    this.isCapturing = true;
  }

  /**
   * Arrête la capture des logs
   */
  stopCapturing(): void {
    if (!this.isCapturing) return;

    // Restaurer les méthodes console originales
    Object.keys(this.originalConsole).forEach(level => {
      console[level as keyof Console] = this.originalConsole[level];
    });

    this.isCapturing = false;
  }

  /**
   * Ajoute un listener pour les changements de logs
   */
  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifie tous les listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in logs listener:', error);
      }
    });
  }

  /**
   * Effectue la rotation des logs (supprime les anciens)
   */
  private rotateLogs(): void {
    const now = Date.now();
    
    // Supprimer les logs trop anciens
    this.logs = this.logs.filter(log => (now - log.timestamp) < MAX_AGE_MS);
    
    // Limiter le nombre de logs
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }
  }

  /**
   * Nettoie les messages pour supprimer les données sensibles
   */
  private sanitizeMessage(message: string): string {
    // Patterns pour détecter des données sensibles
    const sensitivePatterns = [
      /password[=:]\s*[^\s]+/gi,
      /token[=:]\s*[^\s]+/gi,
      /key[=:]\s*[^\s]+/gi,
      /secret[=:]\s*[^\s]+/gi,
      /authorization:\s*[^\s]+/gi
    ];

    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        const parts = match.split(/[=:]/);
        return `${parts[0]}=${parts[0].includes('=') ? '***' : ': ***'}`;
      });
    });

    return sanitized;
  }

  /**
   * Sauvegarde les logs dans le localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        logs: this.logs.slice(0, 100), // Ne sauvegarder que les 100 derniers
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * Charge les logs depuis le localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.logs && Array.isArray(data.logs)) {
          // Filtrer les logs trop anciens
          const now = Date.now();
          this.logs = data.logs.filter((log: LogEntry) => 
            (now - log.timestamp) < MAX_AGE_MS
          );
        }
      }
    } catch (error) {
      console.warn('Failed to load logs from storage:', error);
      this.logs = [];
    }
  }
}

// Instance singleton
export const LogsService = new LogsServiceClass();