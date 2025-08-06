/**
 * Service de gestion des DevTools
 */

const DEVTOOLS_STORAGE_KEY = 'dimicall-devtools-enabled';

export class DevToolsService {
  /**
   * Détecte si l'application est en mode développement
   * En mode développement, les DevTools sont toujours autorisés
   */
  static async isProductionMode(): Promise<boolean> {
    try {
      // Demander au processus principal si on est en mode développement
      if (window.electronAPI?.getAppVersion) {
        // En mode développement, la version contient souvent "dev" ou est "0.0.0"
        const version = await window.electronAPI.getAppVersion();
        return version !== '0.0.0' && !version.includes('dev');
      }
      
      // Fallback: détecter via l'URL (en développement, on a souvent localhost)
      return !window.location.href.includes('localhost') && 
             !window.location.protocol.startsWith('file:');
    } catch (error) {
      console.error('❌ Erreur lors de la détection de l\'environnement:', error);
      // En cas d'erreur, considérer comme production par sécurité
      return true;
    }
  }

  /**
   * Vérifie si les DevTools doivent être activés selon l'environnement et les préférences
   */
  static async shouldEnableDevTools(): Promise<boolean> {
    const isProduction = await this.isProductionMode();
    
    // En mode développement : toujours autorisé
    if (!isProduction) {
      console.log('🔧 Mode développement détecté - DevTools toujours autorisés');
      return true;
    }
    
    // En mode production : selon les préférences utilisateur
    const userPreference = this.isEnabled();
    console.log(`🔧 Mode production - DevTools ${userPreference ? 'activés' : 'désactivés'} par l'utilisateur`);
    return userPreference;
  }
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
      // En cas d'erreur de localStorage, on continue sans bloquer l'application
      console.warn('⚠️ Les préférences DevTools ne seront pas persistantes pour cette session');
    }
  }

  /**
   * Active les DevTools
   */
  static async enableDevTools(): Promise<void> {
    try {
      // En mode développement, les DevTools sont toujours disponibles
      const isProduction = await this.isProductionMode();
      if (!isProduction) {
        this.setEnabled(true);
        console.log('🔧 DevTools activés (mode développement)');
        return;
      }

      // En mode production, utiliser l'API Electron
      if (window.electronAPI?.devTools?.enable) {
        const result = await window.electronAPI.devTools.enable();
        if (result.success) {
          this.setEnabled(true);
          console.log('🔧 DevTools activés');
        } else {
          console.error('❌ Erreur lors de l\'activation des DevTools:', result.error);
          throw new Error(`Échec de l'activation des DevTools: ${result.error}`);
        }
      } else {
        console.warn('⚠️ API d\'activation des DevTools non disponible');
        throw new Error('API d\'activation des DevTools non disponible');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'activation des DevTools:', error);
      // Ne pas re-throw pour éviter de casser l'UI
    }
  }

  /**
   * Désactive les DevTools
   */
  static async disableDevTools(): Promise<void> {
    try {
      if (window.electronAPI?.devTools?.disable) {
        const result = await window.electronAPI.devTools.disable();
        if (result.success) {
          this.setEnabled(false);
          console.log('🔧 DevTools désactivés');
        } else {
          console.error('❌ Erreur lors de la désactivation des DevTools:', result.error);
        }
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
  static async toggleDevTools(): Promise<void> {
    const currentState = this.isEnabled();
    if (currentState) {
      await this.disableDevTools();
    } else {
      await this.enableDevTools();
    }
  }

  /**
   * Vérifie si les DevTools sont activés côté Electron
   */
  static async isDevToolsEnabledInElectron(): Promise<boolean> {
    try {
      if (window.electronAPI?.devTools?.isEnabled) {
        const result = await window.electronAPI.devTools.isEnabled();
        return result.enabled;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'état des DevTools:', error);
      return false;
    }
  }
}