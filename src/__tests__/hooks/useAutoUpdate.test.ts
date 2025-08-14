/**
 * Tests for useAutoUpdate hook with platform-specific behavior
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';

// Mock the PlatformUpdateService
jest.mock('../../services/PlatformUpdateService', () => ({
  PlatformUpdateService: {
    getUpdateConfiguration: jest.fn(),
    isUpdateEnabled: jest.fn(),
    getManualUpdateInfo: jest.fn()
  }
}));

// Mock window.electronAPI
const mockElectronAPI = {
  getUpdateStatus: jest.fn(),
  checkForUpdates: jest.fn(),
  installUpdate: jest.fn(),
  revertToStable: jest.fn(),
  onUpdateChecking: jest.fn(),
  onUpdateAvailable: jest.fn(),
  onUpdateNotAvailable: jest.fn(),
  onUpdateError: jest.fn(),
  onUpdateDownloadProgress: jest.fn(),
  onUpdateDownloaded: jest.fn()
};

// Mock BetaPreferencesService
jest.mock('../../services/betaPreferencesService', () => ({
  BetaPreferencesService: {
    getBetaPreferences: jest.fn(() => ({
      enabled: false,
      lastModified: Date.now(),
      hasBeenWarned: false
    })),
    setBetaPreferences: jest.fn(),
    cleanupObsoleteData: jest.fn()
  }
}));

describe('useAutoUpdate', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default window.electronAPI mock
    (global as any).window = {
      electronAPI: mockElectronAPI
    };
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe('when updates are enabled', () => {
    beforeEach(() => {
      mockElectronAPI.getUpdateStatus.mockResolvedValue({
        updateAvailable: false,
        updateDownloaded: false,
        updateInfo: null,
        updateEnabled: true,
        manualUpdateInfo: null
      });
    });

    it('should initialize with updates enabled', async () => {
      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isUpdateEnabled).toBe(true);
      expect(result.current.manualUpdateInfo).toBeNull();
    });

    it('should allow checking for updates', async () => {
      mockElectronAPI.checkForUpdates.mockResolvedValue({ status: 'checking' });

      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(mockElectronAPI.checkForUpdates).toHaveBeenCalled();
    });

    it('should allow installing updates', async () => {
      mockElectronAPI.installUpdate.mockResolvedValue({ success: true });
      mockElectronAPI.getUpdateStatus.mockResolvedValue({
        updateAvailable: true,
        updateDownloaded: true,
        updateInfo: { version: '1.0.1' },
        updateEnabled: true,
        manualUpdateInfo: null
      });

      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.installUpdate();
      });

      expect(mockElectronAPI.installUpdate).toHaveBeenCalled();
    });
  });

  describe('when updates are disabled', () => {
    const mockManualUpdateInfo = {
      url: 'https://github.com/test/releases',
      message: 'Manual updates required on this platform',
      platform: 'darwin',
      version: '1.0.0'
    };

    beforeEach(() => {
      mockElectronAPI.getUpdateStatus.mockResolvedValue({
        updateAvailable: false,
        updateDownloaded: false,
        updateInfo: null,
        updateEnabled: false,
        manualUpdateInfo: mockManualUpdateInfo
      });
    });

    it('should initialize with updates disabled', async () => {
      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isUpdateEnabled).toBe(false);
      expect(result.current.manualUpdateInfo).toEqual(mockManualUpdateInfo);
    });

    it('should block checking for updates', async () => {
      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Update check blocked')
      );
      expect(mockElectronAPI.checkForUpdates).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should block installing updates', async () => {
      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        await result.current.installUpdate();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Update installation blocked')
      );
      expect(mockElectronAPI.installUpdate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not setup event listeners when updates are disabled', async () => {
      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Event listeners should not be called when updates are disabled
      expect(mockElectronAPI.onUpdateChecking).not.toHaveBeenCalled();
      expect(mockElectronAPI.onUpdateAvailable).not.toHaveBeenCalled();
      expect(mockElectronAPI.onUpdateNotAvailable).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle getUpdateStatus errors gracefully', async () => {
      mockElectronAPI.getUpdateStatus.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erreur lors de l\'initialisation'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing electronAPI gracefully', async () => {
      delete (global as any).window.electronAPI;

      const { result } = renderHook(() => useAutoUpdate());

      await act(async () => {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should not crash and should have default values
      expect(result.current.isUpdateEnabled).toBe(true); // Default value
      expect(result.current.manualUpdateInfo).toBeNull();
    });
  });
});