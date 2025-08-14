/**
 * Service de gestion des préférences pour les versions bêta
 */

export interface BetaPreferences {
  /** Indique si l'utilisateur a opté pour les versions bêta */
  enabled: boolean;
  /** Timestamp de la dernière modification des préférences */
  lastModified: number;
  /** Indique si l'utilisateur a été averti des risques */
  hasBeenWarned: boolean;
}

const STORAGE_KEY = 'dimicall-beta-preferences';
const CURRENT_VERSION_TYPE_KEY = 'dimicall-version-type';

const DEFAULT_PREFERENCES: BetaPreferences = {
  enabled: false,
  lastModified: Date.now(),
  hasBeenWarned: false,
};

export class BetaPreferencesService {
  /**
   * Récupère les préférences bêta actuelles
   */
  static getBetaPreferences(): BetaPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { ...DEFAULT_PREFERENCES };
      }

      const parsed = JSON.parse(stored);
      
      // Validation des données
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('Préférences bêta corrompues, utilisation des valeurs par défaut');
        return { ...DEFAULT_PREFERENCES };
      }

      // Migration des anciennes versions si nécessaire
      const migrated = this.migratePreferences(parsed);
      
      return {
        enabled: Boolean(migrated.enabled),
        lastModified: Number(migrated.lastModified) || Date.now(),
        hasBeenWarned: Boolean(migrated.hasBeenWarned),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences bêta:', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Sauvegarde les préférences bêta
   */
  static setBetaPreferences(preferences: BetaPreferences): void {
    try {
      const toSave = {
        ...preferences,
        lastModified: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      
      // Sauvegarder aussi le type de version actuel
      this.setCurrentVersionType(preferences.enabled ? 'beta' : 'stable');
      
      console.log('Préférences bêta sauvegardées:', toSave);
      
      // Synchroniser avec Electron
      this.syncWithElectron(toSave);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences bêta:', error);
      
      // Retry une fois en cas d'erreur
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        this.syncWithElectron(preferences);
      } catch (retryError) {
        console.error('Échec du retry de sauvegarde:', retryError);
        throw new Error('Impossible de sauvegarder les préférences bêta');
      }
    }
  }

  /**
   * Synchronise les préférences avec le processus Electron
   */
  static async syncWithElectron(preferences: BetaPreferences): Promise<void> {
    try {
      if (window.electronAPI?.syncBetaPreferences) {
        const result = await window.electronAPI.syncBetaPreferences(preferences);
        if (result.success) {
          console.log('✅ Préférences synchronisées avec Electron');
        } else {
          console.error('❌ Erreur sync Electron:', result.message);
        }
      } else {
        console.warn('⚠️ API Electron non disponible pour la synchronisation');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation avec Electron:', error);
    }
  }

  /**
   * Active/désactive les versions bêta
   */
  static toggleBetaOptIn(enabled: boolean): void {
    const currentPrefs = this.getBetaPreferences();
    const newPrefs: BetaPreferences = {
      ...currentPrefs,
      enabled,
      lastModified: Date.now(),
    };

    this.setBetaPreferences(newPrefs);
  }

  /**
   * Vérifie si l'utilisateur utilise actuellement une version bêta
   */
  static isCurrentVersionBeta(): boolean {
    try {
      const versionType = localStorage.getItem(CURRENT_VERSION_TYPE_KEY);
      return versionType === 'beta';
    } catch (error) {
      console.error('Erreur lors de la vérification du type de version:', error);
      return false;
    }
  }

  /**
   * Marque l'utilisateur comme ayant été averti des risques
   */
  static markAsWarned(): void {
    const currentPrefs = this.getBetaPreferences();
    this.setBetaPreferences({
      ...currentPrefs,
      hasBeenWarned: true,
    });
  }

  /**
   * Définit le type de version actuelle
   */
  static setCurrentVersionType(type: 'stable' | 'beta'): void {
    try {
      localStorage.setItem(CURRENT_VERSION_TYPE_KEY, type);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du type de version:', error);
    }
  }

  /**
   * Récupère le type de version actuelle
   */
  static getCurrentVersionType(): 'stable' | 'beta' {
    try {
      const type = localStorage.getItem(CURRENT_VERSION_TYPE_KEY);
      return type === 'beta' ? 'beta' : 'stable';
    } catch (error) {
      console.error('Erreur lors de la récupération du type de version:', error);
      return 'stable';
    }
  }

  /**
   * Réinitialise toutes les préférences bêta
   */
  static resetPreferences(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_VERSION_TYPE_KEY);
      console.log('Préférences bêta réinitialisées');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error);
    }
  }

  /**
   * Migre les anciennes versions de préférences
   */
  private static migratePreferences(preferences: any): BetaPreferences {
    // Si c'est déjà au bon format, retourner tel quel
    if (
      typeof preferences.enabled === 'boolean' &&
      typeof preferences.lastModified === 'number' &&
      typeof preferences.hasBeenWarned === 'boolean'
    ) {
      return preferences;
    }

    // Migration depuis d'anciennes versions
    return {
      enabled: Boolean(preferences.enabled || preferences.betaEnabled),
      lastModified: Number(preferences.lastModified) || Date.now(),
      hasBeenWarned: Boolean(preferences.hasBeenWarned || preferences.warned),
    };
  }

  /**
   * Valide les préférences
   */
  static validatePreferences(preferences: any): preferences is BetaPreferences {
    return (
      typeof preferences === 'object' &&
      preferences !== null &&
      typeof preferences.enabled === 'boolean' &&
      typeof preferences.lastModified === 'number' &&
      typeof preferences.hasBeenWarned === 'boolean'
    );
  }

  /**
   * Nettoie les données obsolètes
   */
  static cleanupObsoleteData(): void {
    try {
      // Nettoyer les anciennes clés de préférences si elles existent
      const obsoleteKeys = [
        'beta-preferences', // Ancienne version
        'dimicall-beta-enabled', // Ancienne version
        'beta-opt-in', // Ancienne version
      ];

      obsoleteKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`Clé obsolète supprimée: ${key}`);
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage des données obsolètes:', error);
    }
  }
}

// Export des types et constantes
export { DEFAULT_PREFERENCES };
export type { BetaPreferences };