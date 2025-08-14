/**
 * Tests for PlatformUpdateService
 * Tests platform-specific update configuration and behavior
 */

import { PlatformUpdateService } from '../../services/PlatformUpdateService';

// Mock process.platform
const originalPlatform = process.platform;
const originalEnv = process.env;

describe('PlatformUpdateService', () => {
  beforeEach(() => {
    // Reset configuration cache before each test
    PlatformUpdateService.resetConfiguration();
    
    // Reset environment variables
    process.env = { ...originalEnv };
    delete process.env.DISABLE_AUTO_UPDATES;
    delete process.env.FORCE_ENABLE_UPDATES;
    delete process.env.MANUAL_UPDATE_URL;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original values
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true
    });
    process.env = originalEnv;
  });

  describe('getUpdateConfiguration', () => {
    it('should disable updates on macOS by default', () => {
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.enabled).toBe(false);
      expect(config.platform).toBe('darwin');
      expect(config.reason).toContain('notarization');
    });

    it('should enable updates on Windows by default', () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.enabled).toBe(true);
      expect(config.platform).toBe('win32');
      expect(config.reason).toBeUndefined();
    });

    it('should enable updates on Linux by default', () => {
      // Mock Linux platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.enabled).toBe(true);
      expect(config.platform).toBe('linux');
      expect(config.reason).toBeUndefined();
    });

    it('should respect DISABLE_AUTO_UPDATES environment variable', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });
      process.env.DISABLE_AUTO_UPDATES = 'true';

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.enabled).toBe(false);
      expect(config.reason).toContain('environment variable');
    });

    it('should respect FORCE_ENABLE_UPDATES environment variable on macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
      process.env.FORCE_ENABLE_UPDATES = 'true';

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.enabled).toBe(true);
      expect(config.platform).toBe('darwin');
    });

    it('should detect GitHub Actions build environment', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
      process.env.GITHUB_ACTIONS = 'true';

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.buildEnvironment).toBe('github-actions');
    });

    it('should detect local development environment', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
      process.env.NODE_ENV = 'development';

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.buildEnvironment).toBe('local');
    });

    it('should use custom manual update URL', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
      const customUrl = 'https://custom.example.com/releases';
      process.env.MANUAL_UPDATE_URL = customUrl;

      const config = PlatformUpdateService.getUpdateConfiguration();

      expect(config.manualUpdateUrl).toBe(customUrl);
    });

    it('should cache configuration between calls', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      const config1 = PlatformUpdateService.getUpdateConfiguration();
      const config2 = PlatformUpdateService.getUpdateConfiguration();

      expect(config1).toBe(config2); // Same object reference
    });
  });

  describe('isUpdateEnabled', () => {
    it('should return false for macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      expect(PlatformUpdateService.isUpdateEnabled()).toBe(false);
    });

    it('should return true for Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      expect(PlatformUpdateService.isUpdateEnabled()).toBe(true);
    });

    it('should return true for Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      expect(PlatformUpdateService.isUpdateEnabled()).toBe(true);
    });
  });

  describe('getManualUpdateInfo', () => {
    it('should return null when updates are enabled', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      const info = PlatformUpdateService.getManualUpdateInfo();

      expect(info).toBeNull();
    });

    it('should return manual update info for macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      const info = PlatformUpdateService.getManualUpdateInfo();

      expect(info).not.toBeNull();
      expect(info?.platform).toBe('darwin');
      expect(info?.url).toContain('github.com');
      expect(info?.message).toContain('macOS');
    });

    it('should use custom manual update URL', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
      const customUrl = 'https://custom.example.com/releases';
      process.env.MANUAL_UPDATE_URL = customUrl;

      const info = PlatformUpdateService.getManualUpdateInfo();

      expect(info?.url).toBe(customUrl);
    });

    it('should include version information', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
      process.env.npm_package_version = '1.2.3';

      const info = PlatformUpdateService.getManualUpdateInfo();

      expect(info?.version).toBe('1.2.3');
    });
  });

  describe('resetConfiguration', () => {
    it('should clear cached configuration', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      // Get initial configuration
      const config1 = PlatformUpdateService.getUpdateConfiguration();
      
      // Reset and get new configuration
      PlatformUpdateService.resetConfiguration();
      const config2 = PlatformUpdateService.getUpdateConfiguration();

      // Should be different object instances but same content
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});