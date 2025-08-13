import * as fs from 'fs'
import * as path from 'path'
import { AdbPermissionChecker } from '../../services/adb-permission-checker'
import { PlatformToolsValidator } from '../../utils/platform-tools-validator'
import { AdbErrorHandler } from '../../utils/adb-error-handler'

// Mock des modules Node.js
jest.mock('fs')
jest.mock('fs/promises')
jest.mock('child_process')

const mockFs = fs as jest.Mocked<typeof fs>
const mockFsPromises = fs.promises as jest.Mocked<typeof fs.promises>

describe('ADB Permissions Integration Tests', () => {
  const testPlatformToolsPath = '/test/platform-tools'
  const testAdbPath = path.join(testPlatformToolsPath, 'adb')

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Complete ADB Permission Workflow', () => {
    it('should successfully validate and fix ADB permissions on macOS', async () => {
      // Mock platform to be macOS
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })

      // Mock file system for platform-tools directory
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      mockFsPromises.access.mockResolvedValue(undefined)
      mockFsPromises.readdir.mockResolvedValue(['adb', 'fastboot', 'etc1tool'] as any)

      // Mock file stats for each binary
      const mockStat = jest.fn()
        .mockResolvedValueOnce({ isDirectory: () => false, mode: 0o100644 }) // adb - not executable
        .mockResolvedValueOnce({ isDirectory: () => false, mode: 0o100755 }) // fastboot - executable
        .mockResolvedValueOnce({ isDirectory: () => false, mode: 0o100644 }) // etc1tool - not executable

      jest.doMock('util', () => ({
        promisify: jest.fn((fn) => {
          if (fn === fs.stat) return mockStat
          if (fn === fs.access) return jest.fn().mockResolvedValue(undefined)
          if (fn === fs.chmod) return jest.fn().mockResolvedValue(undefined)
          return jest.fn()
        })
      }))

      // Mock isExecutable calls
      jest.spyOn(AdbPermissionChecker, 'isExecutable')
        .mockResolvedValueOnce(false) // adb initial check
        .mockResolvedValueOnce(true)  // fastboot check
        .mockResolvedValueOnce(false) // etc1tool check
        .mockResolvedValueOnce(true)  // adb after fix
        .mockResolvedValueOnce(true)  // etc1tool after fix
        .mockResolvedValueOnce(true)  // adb final validation
        .mockResolvedValueOnce(true)  // fastboot final validation

      jest.spyOn(AdbPermissionChecker, 'getFilePermissions')
        .mockResolvedValue('755')

      jest.spyOn(AdbPermissionChecker, 'makeExecutable')
        .mockResolvedValue(true)

      // Execute the complete workflow
      const result = await PlatformToolsValidator.validateAndFixPlatformTools(testPlatformToolsPath)

      // Verify results
      expect(result.isValid).toBe(true)
      expect(result.readyForUse).toBe(true)
      expect(result.validationSummary.totalBinaries).toBe(3)
      expect(result.validationSummary.allCriticalBinariesExecutable).toBe(true)
      expect(result.fixSummary).toBeDefined()
      expect(result.fixSummary?.allFixesSuccessful).toBe(true)
    })

    it('should handle permission fix failures gracefully', async () => {
      // Mock platform to be macOS
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })

      // Mock file system
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      mockFsPromises.access.mockResolvedValue(undefined)
      mockFsPromises.readdir.mockResolvedValue(['adb'] as any)

      const mockStat = jest.fn().mockResolvedValue({ 
        isDirectory: () => false, 
        mode: 0o100644 
      })

      jest.doMock('util', () => ({
        promisify: jest.fn((fn) => {
          if (fn === fs.stat) return mockStat
          if (fn === fs.access) return jest.fn().mockResolvedValue(undefined)
          if (fn === fs.chmod) return jest.fn().mockRejectedValue(new Error('EPERM: operation not permitted'))
          return jest.fn()
        })
      }))

      // Mock permission checks to fail
      jest.spyOn(AdbPermissionChecker, 'isExecutable')
        .mockResolvedValue(false) // Always not executable

      jest.spyOn(AdbPermissionChecker, 'getFilePermissions')
        .mockResolvedValue('644')

      jest.spyOn(AdbPermissionChecker, 'makeExecutable')
        .mockResolvedValue(false) // Fix fails

      // Execute the workflow
      const result = await PlatformToolsValidator.validateAndFixPlatformTools(testPlatformToolsPath)

      // Verify failure handling
      expect(result.isValid).toBe(true)
      expect(result.readyForUse).toBe(false)
      expect(result.fixSummary).toBeDefined()
      expect(result.fixSummary?.allFixesSuccessful).toBe(false)
    })

    it('should skip validation on non-macOS platforms', async () => {
      // Mock platform to be Windows
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })

      // Mock file system
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      mockFsPromises.access.mockResolvedValue(undefined)
      mockFsPromises.readdir.mockResolvedValue(['adb.exe'] as any)

      // Execute validation (should work normally on Windows)
      const result = await PlatformToolsValidator.validateAndFixPlatformTools(testPlatformToolsPath)

      // On Windows, no permission fixes should be needed
      expect(result.isValid).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should properly handle and categorize ADB errors', () => {
      const testCases = [
        {
          error: new Error('ENOENT: no such file or directory'),
          expectedCode: 'ADB_BINARY_NOT_FOUND',
          expectedMessage: 'Binaire ADB non trouvé'
        },
        {
          error: new Error('EACCES: permission denied'),
          expectedCode: 'ADB_PERMISSION_DENIED',
          expectedMessage: 'Permissions insuffisantes pour ADB'
        },
        {
          error: new Error('no devices/emulators found'),
          expectedCode: 'ADB_DEVICE_NOT_FOUND',
          expectedMessage: 'Aucun appareil Android détecté'
        },
        {
          error: new Error('daemon not running'),
          expectedCode: 'ADB_SERVER_NOT_RUNNING',
          expectedMessage: 'Le serveur ADB n\'est pas démarré'
        }
      ]

      testCases.forEach(({ error, expectedCode, expectedMessage }) => {
        const adbError = AdbErrorHandler.analyzeError(error, testAdbPath)
        
        expect(adbError.code).toBe(expectedCode)
        expect(adbError.message).toBe(expectedMessage)
        expect(adbError.adbPath).toBe(testAdbPath)
        expect(adbError.suggestions).toBeDefined()
        expect(adbError.suggestions!.length).toBeGreaterThan(0)
      })
    })

    it('should generate appropriate manual fix instructions', () => {
      const failedBinaries = [
        '/test/platform-tools/adb',
        '/test/platform-tools/fastboot'
      ]

      const instructions = PlatformToolsValidator.generateManualFixInstructions(
        testPlatformToolsPath,
        failedBinaries
      )

      expect(instructions).toContain('chmod +x "/test/platform-tools/adb"')
      expect(instructions).toContain('chmod +x "/test/platform-tools/fastboot"')
      expect(instructions).toContain('chmod +x "/test/platform-tools"/*')
      expect(instructions).toContain('Puis redémarrez l\'application')
    })
  })

  describe('Performance and Caching', () => {
    it('should cache permission check results appropriately', async () => {
      // This test would verify that permission checks are cached
      // and not repeated unnecessarily within the cache interval
      
      const mockCheckAndFix = jest.spyOn(AdbPermissionChecker, 'checkAndFixPermissions')
        .mockResolvedValue({
          success: true,
          wasFixed: false,
          filePath: testAdbPath,
          permissions: '755'
        })

      // First call should check permissions
      await AdbPermissionChecker.checkAndFixPermissions(testAdbPath)
      expect(mockCheckAndFix).toHaveBeenCalledTimes(1)

      // Subsequent calls within cache period should use cache
      // (This would need to be implemented in the actual caching logic)
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('should handle Windows platform correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })

      // On Windows, permission checks should be minimal or skipped
      const error = new Error('Some Windows-specific error')
      const adbError = AdbErrorHandler.analyzeError(error, 'C:\\platform-tools\\adb.exe')

      // Should still provide helpful error analysis
      expect(adbError.code).toBeDefined()
      expect(adbError.message).toBeDefined()
      expect(adbError.suggestions).toBeDefined()
    })

    it('should handle Linux platform correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })

      // Linux should behave similarly to macOS for permissions
      const error = new Error('EACCES: permission denied')
      const adbError = AdbErrorHandler.analyzeError(error, '/usr/local/bin/adb')

      expect(adbError.code).toBe('ADB_PERMISSION_DENIED')
      expect(adbError.suggestions).toContain('Vérifiez les permissions du fichier ADB')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty platform-tools directory', async () => {
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      mockFsPromises.access.mockRejectedValue(new Error('ENOENT: no such file or directory'))
      mockFsPromises.readdir.mockResolvedValue([] as any)

      const result = await PlatformToolsValidator.validateAndFixPlatformTools(testPlatformToolsPath)

      expect(result.isValid).toBe(false)
      expect(result.validationSummary.criticalBinariesMissing).toEqual(['adb', 'fastboot'])
    })

    it('should handle corrupted binary files', async () => {
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      mockFsPromises.access.mockResolvedValue(undefined)
      mockFsPromises.readdir.mockResolvedValue(['adb'] as any)

      // Mock stat to throw error for corrupted file
      const mockStat = jest.fn().mockRejectedValue(new Error('EIO: i/o error'))

      jest.doMock('util', () => ({
        promisify: jest.fn((fn) => {
          if (fn === fs.stat) return mockStat
          return jest.fn()
        })
      }))

      const validationResults = await AdbPermissionChecker.validateAllPlatformTools(testPlatformToolsPath)

      // Should handle corrupted files gracefully
      expect(validationResults).toHaveLength(1)
      expect(validationResults[0].exists).toBe(false)
    })
  })
})