/**
 * Tests unitaires pour DevToolsService
 */

import { DevToolsService } from '../../services/devToolsService';

// Mock de l'API Electron
const mockElectronAPI = {
  devTools: {
    enable: jest.fn(),
    disable: jest.fn(),
    isEnabled: jest.fn()
  }
};

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

// Mock global
(global as any).window = {
  electronAPI: mockElectronAPI
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('DevToolsService', () => {
  beforeEach(() => {
    // Reset tous les mocks avant chaque test
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('isEnabled', () => {
    it('should return false when no preference is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = DevToolsService.isEnabled();
      
      expect(result).toBe(false);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('dimicall-devtools-enabled');
    });

    it('should return true when preference is stored as "true"', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      const result = DevToolsService.isEnabled();
      
      expect(result).toBe(true);
    });

    it('should return false when preference is stored as "false"', () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      
      const result = DevToolsService.isEnabled();
      
      expect(result).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = DevToolsService.isEnabled();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Erreur lors de la vérification de l\'état des DevTools:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('setEnabled', () => {
    it('should save enabled state to localStorage', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      DevToolsService.setEnabled(true);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dimicall-devtools-enabled', 'true');
      expect(consoleSpy).toHaveBeenCalledWith('🔧 DevTools activés par l\'utilisateur');
      
      consoleSpy.mockRestore();
    });

    it('should save disabled state to localStorage', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      DevToolsService.setEnabled(false);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dimicall-devtools-enabled', 'false');
      expect(consoleSpy).toHaveBeenCalledWith('🔧 DevTools désactivés par l\'utilisateur');
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      DevToolsService.setEnabled(true);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Erreur lors de la sauvegarde de l\'état des DevTools:',
        expect.any(Error)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Les préférences DevTools ne seront pas persistantes pour cette session'
      );
      
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('enableDevTools', () => {
    it('should enable DevTools successfully', async () => {
      mockElectronAPI.devTools.enable.mockResolvedValue({ success: true });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await DevToolsService.enableDevTools();
      
      expect(mockElectronAPI.devTools.enable).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dimicall-devtools-enabled', 'true');
      expect(consoleSpy).toHaveBeenCalledWith('🔧 DevTools activés');
      
      consoleSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      mockElectronAPI.devTools.enable.mockResolvedValue({ 
        success: false, 
        error: 'Test error' 
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await DevToolsService.enableDevTools();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Erreur lors de l\'activation des DevTools:',
        'Test error'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle missing API gracefully', async () => {
      (global as any).window.electronAPI.devTools.enable = undefined;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await DevToolsService.enableDevTools();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ API d\'activation des DevTools non disponible'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('disableDevTools', () => {
    it('should disable DevTools successfully', async () => {
      mockElectronAPI.devTools.disable.mockResolvedValue({ success: true });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await DevToolsService.disableDevTools();
      
      expect(mockElectronAPI.devTools.disable).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dimicall-devtools-enabled', 'false');
      expect(consoleSpy).toHaveBeenCalledWith('🔧 DevTools désactivés');
      
      consoleSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      mockElectronAPI.devTools.disable.mockResolvedValue({ 
        success: false, 
        error: 'Test error' 
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await DevToolsService.disableDevTools();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Erreur lors de la désactivation des DevTools:',
        'Test error'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('toggleDevTools', () => {
    it('should enable DevTools when currently disabled', async () => {
      mockLocalStorage.getItem.mockReturnValue('false');
      mockElectronAPI.devTools.enable.mockResolvedValue({ success: true });
      
      await DevToolsService.toggleDevTools();
      
      expect(mockElectronAPI.devTools.enable).toHaveBeenCalled();
    });

    it('should disable DevTools when currently enabled', async () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      mockElectronAPI.devTools.disable.mockResolvedValue({ success: true });
      
      await DevToolsService.toggleDevTools();
      
      expect(mockElectronAPI.devTools.disable).toHaveBeenCalled();
    });
  });

  describe('isDevToolsEnabledInElectron', () => {
    it('should return enabled state from Electron API', async () => {
      mockElectronAPI.devTools.isEnabled.mockResolvedValue({ enabled: true });
      
      const result = await DevToolsService.isDevToolsEnabledInElectron();
      
      expect(result).toBe(true);
      expect(mockElectronAPI.devTools.isEnabled).toHaveBeenCalled();
    });

    it('should handle missing API gracefully', async () => {
      (global as any).window.electronAPI.devTools.isEnabled = undefined;
      
      const result = await DevToolsService.isDevToolsEnabledInElectron();
      
      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockElectronAPI.devTools.isEnabled.mockRejectedValue(new Error('Test error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await DevToolsService.isDevToolsEnabledInElectron();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Erreur lors de la vérification de l\'état des DevTools:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});