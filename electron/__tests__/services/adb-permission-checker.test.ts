import * as fs from 'fs'
import * as path from 'path'
import { AdbPermissionChecker, PermissionCheckResult, BinaryValidationResult } from '../../services/adb-permission-checker'

// Mock des modules Node.js
jest.mock('fs')
jest.mock('fs/promises')

const mockFs = fs as jest.Mocked<typeof fs>
const mockFsPromises = fs.promises as jest.Mocked<typeof fs.promises>

describe('AdbPermissionChecker', () => {
  const testAdbPath = '/test/path/to/adb'
  const testPlatformToolsPath = '/test/path/to/platform-tools'

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console.log and console.error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('isExecutable', () => {
    it('should return true when file is executable', async () => {
      // Mock fs.access to not throw (file is accessible and executable)
      const mockAccess = jest.fn().mockResolvedValue(undefined)
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockAccess)
      }))

      const result = await AdbPermissionChecker.isExecutable(testAdbPath)
      expect(result).toBe(true)
    })

    it('should return false when file is not executable', async () => {
      // Mock fs.access to throw EACCES error
      const mockAccess = jest.fn().mockRejectedValue(new Error('EACCES: permission denied'))
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockAccess)
      }))

      const result = await AdbPermissionChecker.isExecutable(testAdbPath)
      expect(result).toBe(false)
    })

    it('should return false when file does not exist', async () => {
      // Mock fs.access to throw ENOENT error
      const mockAccess = jest.fn().mockRejectedValue(new Error('ENOENT: no such file or directory'))
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockAccess)
      }))

      const result = await AdbPermissionChecker.isExecutable(testAdbPath)
      expect(result).toBe(false)
    })
  })

  describe('makeExecutable', () => {
    it('should successfully make file executable', async () => {
      // Mock fs.stat to return file stats
      const mockStat = jest.fn().mockResolvedValue({
        mode: 0o644 // rw-r--r--
      })
      
      // Mock fs.chmod to succeed
      const mockChmod = jest.fn().mockResolvedValue(undefined)
      
      jest.doMock('util', () => ({
        promisify: jest.fn((fn) => {
          if (fn === fs.stat) return mockStat
          if (fn === fs.chmod) return mockChmod
          return jest.fn()
        })
      }))

      const result = await AdbPermissionChecker.makeExecutable(testAdbPath)
      
      expect(result).toBe(true)
      expect(mockStat).toHaveBeenCalledWith(testAdbPath)
      expect(mockChmod).toHaveBeenCalledWith(testAdbPath, 0o755)
    })

    it('should return false when chmod fails', async () => {
      // Mock fs.stat to return file stats
      const mockStat = jest.fn().mockResolvedValue({
        mode: 0o644
      })
      
      // Mock fs.chmod to fail
      const mockChmod = jest.fn().mockRejectedValue(new Error('EPERM: operation not permitted'))
      
      jest.doMock('util', () => ({
        promisify: jest.fn((fn) => {
          if (fn === fs.stat) return mockStat
          if (fn === fs.chmod) return mockChmod
          return jest.fn()
        })
      }))

      const result = await AdbPermissionChecker.makeExecutable(testAdbPath)
      
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Impossible de rendre exécutable'),
        expect.any(Error)
      )
    })
  })

  describe('getFilePermissions', () => {
    it('should return file permissions in octal format', async () => {
      // Mock fs.stat to return file stats with mode 0o755
      const mockStat = jest.fn().mockResolvedValue({
        mode: 0o100755 // File with rwxr-xr-x permissions
      })
      
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockStat)
      }))

      const result = await AdbPermissionChecker.getFilePermissions(testAdbPath)
      
      expect(result).toBe('755')
      expect(mockStat).toHaveBeenCalledWith(testAdbPath)
    })

    it('should return "unknown" when stat fails', async () => {
      // Mock fs.stat to fail
      const mockStat = jest.fn().mockRejectedValue(new Error('ENOENT: no such file or directory'))
      
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockStat)
      }))

      const result = await AdbPermissionChecker.getFilePermissions(testAdbPath)
      
      expect(result).toBe('unknown')
    })
  })

  describe('checkAndFixPermissions', () => {
    it('should return success when file is already executable', async () => {
      // Mock file exists and is executable
      const mockAccess = jest.fn().mockResolvedValue(undefined)
      const mockStat = jest.fn().mockResolvedValue({ mode: 0o100755 })
      
      jest.doMock('util', () => ({
        promisify: jest.fn((fn) => {
          if (fn === fs.access) return mockAccess
          if (fn === fs.stat) return mockStat
          return jest.fn()
        })
      }))

      // Mock isExecutable to return true
      jest.spyOn(AdbPermissionChecker, 'isExecutable').mockResolvedValue(true)
      jest.spyOn(AdbPermissionChecker, 'getFilePermissions').mockResolvedValue('755')

      const result = await AdbPermissionChecker.checkAndFixPermissions(testAdbPath)

      expect(result.success).toBe(true)
      expect(result.wasFixed).toBe(false)
      expect(result.filePath).toBe(testAdbPath)
      expect(result.permissions).toBe('755')
    })

    it('should fix permissions when file is not executable', async () => {
      // Mock file exists but is not executable initially
      const mockAccess = jest.fn().mockResolvedValue(undefined)
      
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockAccess)
      }))

      // Mock isExecutable to return false first, then true after fix
      jest.spyOn(AdbPermissionChecker, 'isExecutable')
        .mockResolvedValueOnce(false) // Initial check
        .mockResolvedValueOnce(true)  // After fix

      jest.spyOn(AdbPermissionChecker, 'getFilePermissions')
        .mockResolvedValueOnce('644') // Initial permissions
        .mockResolvedValueOnce('755') // After fix

      jest.spyOn(AdbPermissionChecker, 'makeExecutable').mockResolvedValue(true)

      const result = await AdbPermissionChecker.checkAndFixPermissions(testAdbPath)

      expect(result.success).toBe(true)
      expect(result.wasFixed).toBe(true)
      expect(result.filePath).toBe(testAdbPath)
      expect(result.permissions).toBe('755')
    })

    it('should return error when file does not exist', async () => {
      // Mock fs.access to throw ENOENT
      const mockAccess = jest.fn().mockRejectedValue(new Error('ENOENT: no such file or directory'))
      
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockAccess)
      }))

      const result = await AdbPermissionChecker.checkAndFixPermissions(testAdbPath)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Fichier binaire ADB non trouvé')
      expect(result.filePath).toBe(testAdbPath)
    })

    it('should return error when permission fix fails', async () => {
      // Mock file exists but is not executable
      const mockAccess = jest.fn().mockResolvedValue(undefined)
      
      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockAccess)
      }))

      // Mock isExecutable to always return false (fix failed)
      jest.spyOn(AdbPermissionChecker, 'isExecutable').mockResolvedValue(false)
      jest.spyOn(AdbPermissionChecker, 'getFilePermissions').mockResolvedValue('644')
      jest.spyOn(AdbPermissionChecker, 'makeExecutable').mockResolvedValue(false)

      const result = await AdbPermissionChecker.checkAndFixPermissions(testAdbPath)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Impossible de modifier les permissions')
      expect(result.filePath).toBe(testAdbPath)
    })
  })

  describe('validateAllPlatformTools', () => {
    it('should validate all binaries in platform-tools directory', async () => {
      // Mock fs.readdir to return list of files
      mockFsPromises.readdir.mockResolvedValue([
        'adb',
        'fastboot',
        'etc1tool',
        'NOTICE.txt',
        'source.properties'
      ] as any)

      // Mock fs.stat for each file
      const mockStat = jest.fn()
        .mockResolvedValueOnce({ isDirectory: () => false }) // adb
        .mockResolvedValueOnce({ isDirectory: () => false }) // fastboot
        .mockResolvedValueOnce({ isDirectory: () => false }) // etc1tool
        .mockResolvedValueOnce({ isDirectory: () => false }) // NOTICE.txt
        .mockResolvedValueOnce({ isDirectory: () => false }) // source.properties

      jest.doMock('util', () => ({
        promisify: jest.fn(() => mockStat)
      }))

      // Mock other methods
      jest.spyOn(AdbPermissionChecker, 'isExecutable')
        .mockResolvedValueOnce(true)  // adb
        .mockResolvedValueOnce(false) // fastboot
        .mockResolvedValueOnce(true)  // etc1tool

      jest.spyOn(AdbPermissionChecker, 'getFilePermissions')
        .mockResolvedValue('755')

      const result = await AdbPermissionChecker.validateAllPlatformTools(testPlatformToolsPath)

      expect(result).toHaveLength(3) // Only binary files, not .txt or .properties
      expect(result[0].binaryName).toBe('adb')
      expect(result[0].isExecutable).toBe(true)
      expect(result[1].binaryName).toBe('fastboot')
      expect(result[1].isExecutable).toBe(false)
      expect(result[1].needsFix).toBe(true)
    })

    it('should handle directory read errors gracefully', async () => {
      // Mock fs.readdir to throw error
      mockFsPromises.readdir.mockRejectedValue(new Error('EACCES: permission denied'))

      const result = await AdbPermissionChecker.validateAllPlatformTools(testPlatformToolsPath)

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Impossible de lire le dossier platform-tools'),
        expect.any(Error)
      )
    })
  })

  describe('fixAllBinaryPermissions', () => {
    it('should fix permissions for binaries that need fixing', async () => {
      const validationResults: BinaryValidationResult[] = [
        {
          binaryName: 'adb',
          path: '/test/adb',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        },
        {
          binaryName: 'fastboot',
          path: '/test/fastboot',
          exists: true,
          isExecutable: false,
          permissions: '644',
          needsFix: true
        }
      ]

      // Mock checkAndFixPermissions
      jest.spyOn(AdbPermissionChecker, 'checkAndFixPermissions').mockResolvedValue({
        success: true,
        wasFixed: true,
        filePath: '/test/fastboot',
        permissions: '755'
      })

      const result = await AdbPermissionChecker.fixAllBinaryPermissions(validationResults)

      expect(result).toHaveLength(1) // Only fastboot needed fixing
      expect(result[0].success).toBe(true)
      expect(result[0].wasFixed).toBe(true)
    })

    it('should return empty array when no binaries need fixing', async () => {
      const validationResults: BinaryValidationResult[] = [
        {
          binaryName: 'adb',
          path: '/test/adb',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        }
      ]

      const result = await AdbPermissionChecker.fixAllBinaryPermissions(validationResults)

      expect(result).toEqual([])
      expect(console.log).toHaveBeenCalledWith('✅ Aucun binaire ne nécessite de correction de permissions')
    })
  })

  describe('validateAndFixAllBinaries', () => {
    it('should validate and fix all binaries in platform-tools', async () => {
      // Mock validateAllPlatformTools
      const mockValidationResults: BinaryValidationResult[] = [
        {
          binaryName: 'adb',
          path: '/test/adb',
          exists: true,
          isExecutable: false,
          permissions: '644',
          needsFix: true
        }
      ]

      jest.spyOn(AdbPermissionChecker, 'validateAllPlatformTools')
        .mockResolvedValue(mockValidationResults)

      // Mock fixAllBinaryPermissions
      const mockFixResults: PermissionCheckResult[] = [
        {
          success: true,
          wasFixed: true,
          filePath: '/test/adb',
          permissions: '755'
        }
      ]

      jest.spyOn(AdbPermissionChecker, 'fixAllBinaryPermissions')
        .mockResolvedValue(mockFixResults)

      const result = await AdbPermissionChecker.validateAndFixAllBinaries(testPlatformToolsPath)

      expect(result.validationResults).toEqual(mockValidationResults)
      expect(result.fixResults).toEqual(mockFixResults)
      expect(result.allFixed).toBe(true)
    })
  })
})