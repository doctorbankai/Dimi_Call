/**
 * Service de gestion des DevTools
 */

const DEVTOOLS_STORAGE_KEY = 'dimicall-devtools-enabled';

export class DevToolsService {
  /**
   * Vérifie si les DevTools sont activés selon les préférences utilisateur
   */
  static isEnabled(): boolean {
    try {
      const stored = localStorage.getItem(DEVTOOLS_STORAGE_KEY);
      return stored === 'true';
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'état des DevTools:', error);
      return false;
    }
  }

  /**
   * Sauvegarde l'état des DevTools
   */
  static setEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(DEVTOOLS_STORAGE_KEY, enabled.toString());
      console.log(`🔧 DevTools ${enabled ? 'activés' : 'désactivés'} par l'utilisateur`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'état des DevTools:', error);
    }
  }

  /**
   * Active les DevTools
   */
  static enableDevTools(): void {
    try {
      if (window.electronAPI?.enableDevTools) {
        window.electronAPI.enableDevTools();
        this.setEnabled(true);
        console.log('🔧 DevTools activés');
      } else {
        console.warn('⚠️ API d\'activation des DevTools non disponible');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'activation des DevTools:', error);
    }
  }

  /**
   * Désactive les DevTools
   */
  static disableDevTools(): void {
    try {
      if (window.electronAPI?.disableDevTools) {
        window.electronAPI.disableDevTools();
        this.setEnabled(false);
        console.log('🔧 DevTools désactivés');
      } else {
        console.warn('⚠️ API de désactivation des DevTools non disponible');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la désactivation des DevTools:', error);
    }
  }

  /**
   * Toggle les DevTools
   */
  static toggleDevTools(): void {
    const currentState = this.isEnabled();
    if (currentState) {
      this.disableDevTools();
    } else {
      this.enableDevTools();
    }
  }

  /**
   * Vérifie si les DevTools sont activés côté Electron
   */
  static isDevToolsEnabledInElectron(): boolean {
    try {
      if (window.electronAPI?.isDevToolsEnabled) {
        return window.electronAPI.isDevToolsEnabled();
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'état des DevTools:', error);
      return false;
    }
  }
}