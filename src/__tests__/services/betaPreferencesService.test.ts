/**
 * Tests unitaires pour BetaPreferencesService
 */

import { BetaPreferencesService, BetaPreferences, DEFAULT_PREFERENCES } from '../../services/betaPreferencesService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('BetaPreferencesService', () => {
  beforeEach(() => {
    // Réinitialiser le localStorage mock avant chaque test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('getBetaPreferences', () => {
    it('should return default preferences when no data is stored', () => {
      const preferences = BetaPreferencesService.getBetaPreferences();
      
      expect(preferences).toEqual({
        enabled: false,
        lastModified: expect.any(Number),
        hasBeenWarned: false,
      });
    });

    it('should return stored preferences when valid data exists', () => {
      const testPreferences: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      localStorageMock.setItem('dimicall-beta-preferences', JSON.stringify(testPreferences));

      const preferences = BetaPreferencesService.getBetaPreferences();
      
      expect(preferences).toEqual(testPreferences);
    });

    it('should return default preferences when stored data is corrupted', () => {
      localStorageMock.setItem('dimicall-beta-preferences', 'invalid-json');

      const preferences = BetaPreferencesService.getBetaPreferences();
      
      expect(preferences).toEqual({
        enabled: false,
        lastModified: expect.any(Number),
        hasBeenWarned: false,
      });
    });

    it('should migrate old preference format', () => {
      const oldFormat = {
        betaEnabled: true,
        warned: true,
        lastModified: 1234567890,
      };

      localStorageMock.setItem('dimicall-beta-preferences', JSON.stringify(oldFormat));

      const preferences = BetaPreferencesService.getBetaPreferences();
      
      expect(preferences).toEqual({
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      });
    });

    it('should handle null or non-object stored data', () => {
      localStorageMock.setItem('dimicall-beta-preferences', JSON.stringify(null));

      const preferences = BetaPreferencesService.getBetaPreferences();
      
      expect(preferences).toEqual({
        enabled: false,
        lastModified: expect.any(Number),
        hasBeenWarned: false,
      });
    });
  });

  describe('setBetaPreferences', () => {
    it('should save preferences to localStorage', () => {
      const testPreferences: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      BetaPreferencesService.setBetaPreferences(testPreferences);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dimicall-beta-preferences',
        JSON.stringify({
          ...testPreferences,
          lastModified: expect.any(Number),
        })
      );
    });

    it('should update lastModified timestamp', () => {
      const testPreferences: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      const beforeTime = Date.now();
      BetaPreferencesService.setBetaPreferences(testPreferences);
      const afterTime = Date.now();

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(savedData.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should set version type when saving preferences', () => {
      const testPreferences: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      BetaPreferencesService.setBetaPreferences(testPreferences);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dimicall-version-type',
        'beta'
      );
    });

    it('should retry on localStorage error', () => {
      const testPreferences: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      // Simuler une erreur sur le premier appel, succès sur le second
      localStorageMock.setItem
        .mockImplementationOnce(() => {
          throw new Error('Storage error');
        })
        .mockImplementationOnce(() => {});

      expect(() => {
        BetaPreferencesService.setBetaPreferences(testPreferences);
      }).not.toThrow();

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3); // 2 pour les préférences + 1 pour le type de version
    });

    it('should throw error if retry also fails', () => {
      const testPreferences: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        BetaPreferencesService.setBetaPreferences(testPreferences);
      }).toThrow('Impossible de sauvegarder les préférences bêta');
    });
  });

  describe('toggleBetaOptIn', () => {
    it('should enable beta opt-in', () => {
      BetaPreferencesService.toggleBetaOptIn(true);

      const preferences = BetaPreferencesService.getBetaPreferences();
      expect(preferences.enabled).toBe(true);
    });

    it('should disable beta opt-in', () => {
      // D'abord activer
      BetaPreferencesService.toggleBetaOptIn(true);
      // Puis désactiver
      BetaPreferencesService.toggleBetaOptIn(false);

      const preferences = BetaPreferencesService.getBetaPreferences();
      expect(preferences.enabled).toBe(false);
    });

    it('should preserve other preferences when toggling', () => {
      const initialPrefs: BetaPreferences = {
        enabled: false,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      BetaPreferencesService.setBetaPreferences(initialPrefs);
      BetaPreferencesService.toggleBetaOptIn(true);

      const preferences = BetaPreferencesService.getBetaPreferences();
      expect(preferences.enabled).toBe(true);
      expect(preferences.hasBeenWarned).toBe(true);
    });
  });

  describe('isCurrentVersionBeta', () => {
    it('should return true when version type is beta', () => {
      localStorageMock.setItem('dimicall-version-type', 'beta');

      const isBeta = BetaPreferencesService.isCurrentVersionBeta();
      expect(isBeta).toBe(true);
    });

    it('should return false when version type is stable', () => {
      localStorageMock.setItem('dimicall-version-type', 'stable');

      const isBeta = BetaPreferencesService.isCurrentVersionBeta();
      expect(isBeta).toBe(false);
    });

    it('should return false when no version type is stored', () => {
      const isBeta = BetaPreferencesService.isCurrentVersionBeta();
      expect(isBeta).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const isBeta = BetaPreferencesService.isCurrentVersionBeta();
      expect(isBeta).toBe(false);
    });
  });

  describe('markAsWarned', () => {
    it('should mark user as warned', () => {
      BetaPreferencesService.markAsWarned();

      const preferences = BetaPreferencesService.getBetaPreferences();
      expect(preferences.hasBeenWarned).toBe(true);
    });

    it('should preserve other preferences when marking as warned', () => {
      const initialPrefs: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: false,
      };

      BetaPreferencesService.setBetaPreferences(initialPrefs);
      BetaPreferencesService.markAsWarned();

      const preferences = BetaPreferencesService.getBetaPreferences();
      expect(preferences.enabled).toBe(true);
      expect(preferences.hasBeenWarned).toBe(true);
    });
  });

  describe('getCurrentVersionType', () => {
    it('should return beta when version type is beta', () => {
      localStorageMock.setItem('dimicall-version-type', 'beta');

      const versionType = BetaPreferencesService.getCurrentVersionType();
      expect(versionType).toBe('beta');
    });

    it('should return stable when version type is stable', () => {
      localStorageMock.setItem('dimicall-version-type', 'stable');

      const versionType = BetaPreferencesService.getCurrentVersionType();
      expect(versionType).toBe('stable');
    });

    it('should return stable by default', () => {
      const versionType = BetaPreferencesService.getCurrentVersionType();
      expect(versionType).toBe('stable');
    });
  });

  describe('resetPreferences', () => {
    it('should remove all beta-related data from localStorage', () => {
      // Ajouter des données
      localStorageMock.setItem('dimicall-beta-preferences', '{}');
      localStorageMock.setItem('dimicall-version-type', 'beta');

      BetaPreferencesService.resetPreferences();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dimicall-beta-preferences');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dimicall-version-type');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        BetaPreferencesService.resetPreferences();
      }).not.toThrow();
    });
  });

  describe('validatePreferences', () => {
    it('should return true for valid preferences', () => {
      const validPrefs: BetaPreferences = {
        enabled: true,
        lastModified: 1234567890,
        hasBeenWarned: true,
      };

      const isValid = BetaPreferencesService.validatePreferences(validPrefs);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid preferences', () => {
      const invalidPrefs = [
        null,
        undefined,
        'string',
        123,
        { enabled: 'not-boolean' },
        { enabled: true, lastModified: 'not-number' },
        { enabled: true, lastModified: 123, hasBeenWarned: 'not-boolean' },
        { enabled: true, lastModified: 123 }, // missing hasBeenWarned
      ];

      invalidPrefs.forEach(prefs => {
        const isValid = BetaPreferencesService.validatePreferences(prefs);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('cleanupObsoleteData', () => {
    it('should remove obsolete keys from localStorage', () => {
      // Ajouter des clés obsolètes
      localStorageMock.setItem('beta-preferences', '{}');
      localStorageMock.setItem('dimicall-beta-enabled', 'true');
      localStorageMock.setItem('beta-opt-in', 'false');

      BetaPreferencesService.cleanupObsoleteData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('beta-preferences');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dimicall-beta-enabled');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('beta-opt-in');
    });

    it('should not remove keys that do not exist', () => {
      BetaPreferencesService.cleanupObsoleteData();

      // removeItem ne devrait pas être appelé pour des clés inexistantes
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        BetaPreferencesService.cleanupObsoleteData();
      }).not.toThrow();
    });
  });
});