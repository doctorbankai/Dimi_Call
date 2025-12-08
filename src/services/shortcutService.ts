import { ContactStatus } from '../types';

export interface ShortcutConfig {
  key: string;
  status: string;
  label: string;
}

const SHORTCUTS_STORAGE_KEY = 'dimiCall_shortcuts_config';

// Configuration par défaut des raccourcis
export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { key: 'F2', status: ContactStatus.Premature, label: 'Prématuré' },
  { key: 'F3', status: ContactStatus.MauvaisNum, label: 'Mauvais num' },
  { key: 'F4', status: ContactStatus.Repondeur, label: 'Répondeur' },
  { key: 'F5', status: ContactStatus.ARappeler, label: 'À rappeler' },
  { key: 'F6', status: ContactStatus.PasInteresse, label: 'Pas intéressé' },
  { key: 'F7', status: ContactStatus.Argumente, label: 'Argumenté' },
  { key: 'F8', status: ContactStatus.D0, label: 'D0' },
  { key: 'F9', status: ContactStatus.R0, label: 'R0' },
  { key: 'F10', status: ContactStatus.ListeNoire, label: 'Liste noire' }
];

/**
 * Service pour gérer les raccourcis clavier personnalisés
 */
class ShortcutService {
  private shortcuts: ShortcutConfig[] = [];

  constructor() {
    this.loadShortcuts();
  }

  /**
   * Charger les raccourcis depuis localStorage
   */
  private loadShortcuts(): void {
    try {
      const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && this.validateShortcuts(parsed)) {
          this.shortcuts = parsed;
        } else {
          console.warn('⚠️ Configuration de raccourcis invalide, utilisation de la configuration par défaut');
          this.shortcuts = [...DEFAULT_SHORTCUTS];
          this.saveShortcuts();
        }
      } else {
        this.shortcuts = [...DEFAULT_SHORTCUTS];
        this.saveShortcuts();
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des raccourcis:', error);
      this.shortcuts = [...DEFAULT_SHORTCUTS];
    }
  }

  /**
   * Sauvegarder les raccourcis dans localStorage
   */
  private saveShortcuts(): void {
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(this.shortcuts));
      console.log('💾 Configuration des raccourcis sauvegardée');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des raccourcis:', error);
    }
  }

  /**
   * Valider la configuration des raccourcis
   */
  private validateShortcuts(shortcuts: any[]): boolean {
    if (!Array.isArray(shortcuts)) return false;
    
    return shortcuts.every(shortcut => 
      shortcut && 
      typeof shortcut.key === 'string' &&
      typeof shortcut.status === 'string' &&
      typeof shortcut.label === 'string'
    );
  }

  /**
   * Obtenir tous les raccourcis configurés
   */
  getShortcuts(): ShortcutConfig[] {
    return [...this.shortcuts];
  }

  /**
   * Obtenir le statut associé à une touche
   */
  getStatusForKey(key: string): string | null {
    const shortcut = this.shortcuts.find(s => s.key === key);
    return shortcut ? shortcut.status : null;
  }

  /**
   * Mettre à jour un raccourci
   */
  updateShortcut(key: string, status: string, label?: string): void {
    const index = this.shortcuts.findIndex(s => s.key === key);
    if (index !== -1) {
      this.shortcuts[index] = {
        key,
        status,
        label: label || this.getStatusLabel(status)
      };
      this.saveShortcuts();
    }
  }

  /**
   * Mettre à jour tous les raccourcis
   */
  updateAllShortcuts(newShortcuts: ShortcutConfig[]): void {
    if (!Array.isArray(newShortcuts)) throw new Error('Configuration de raccourcis invalide');
    this.shortcuts = [...newShortcuts];
    this.saveShortcuts();
  }

  /**
   * Remettre les raccourcis par défaut
   */
  resetToDefaults(): void {
    this.shortcuts = [...DEFAULT_SHORTCUTS];
    this.saveShortcuts();
  }

  /**
   * Obtenir le libellé par défaut d'un statut
   */
  private getStatusLabel(status: ContactStatus): string {
    return status;
  }

  /**
   * Créer un mapping key -> status pour usage dans les event handlers
   */
  getKeyStatusMapping(): Record<string, ContactStatus> {
    const mapping: Record<string, ContactStatus> = {};
    this.shortcuts.forEach(shortcut => {
      mapping[shortcut.key] = shortcut.status;
    });
    return mapping;
  }

  /**
   * Vérifier si une touche est configurée
   */
  isKeyConfigured(key: string): boolean {
    return this.shortcuts.some(s => s.key === key);
  }
}

// Export d'une instance singleton
export const shortcutService = new ShortcutService(); 