import * as fs from 'fs'
import { PlatformToolsValidator, PlatformToolsValidationSummary } from '../../utils/platform-tools-validator'
import { AdbPermissionChecker, BinaryValidationResult } from '../../services/adb-permission-checker'

// Mock des modules
jest.mock('../../services/adb-permission-checker')
jest.mock('fs/promises')

const mockAdbPermissionChecker = AdbPermissionChecker as jest.Mocked<typeof AdbPermissionChecker>
const mockFsPromises = fs.promises as jest.Mocked<typeof fs.promises>

describe('PlatformToolsValidator', () => {
  const testPlatformToolsPath = '/test/platform-tools'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('validateAllBinaries', () => {
    it('should validate all binaries and return summary', async () => {
      const mockValidationResults: BinaryValidationResult[] = [
        {
          binaryName: 'adb',
          path: '/test/platform-tools/adb',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        },
        {
          binaryName: 'fastboot',
          path: '/test/platform-tools/fastboot',
          exists: true,
          isExecutable: false,
          permissions: '644',
          needsFix: true
        },
        {
          binaryName: 'etc1tool',
          path: '/test/platform-tools/etc1tool',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        }
      ]

      mockAdbPermissionChecker.validateAllPlatformTools.mockResolvedValue(mockValidationResults)

      const result = await PlatformToolsValidator.validateAllBinaries(testPlatformToolsPath)

      expect(result.totalBinaries).toBe(3)
      expect(result.executableBinaries).toBe(2)
      expect(result.nonExecutableBinaries).toBe(1)
      expect(result.criticalBinariesMissing).toEqual([])
      expect(result.allCriticalBinariesExecutable).toBe(false) // fastboot is not executable
      expect(result.validationDetails).toEqual(mockValidationResults)
    })

    it('should identify missing critical binaries', async () => {
      const mockValidationResults: BinaryValidationResult[] = [
        {
          binaryName: 'etc1tool',
          path: '/test/platform-tools/etc1tool',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        }
      ]

      mockAdbPermissionChecker.validateAllPlatformTools.mockResolvedValue(mockValidationResults)

      const result = await PlatformToolsValidator.validateAllBinaries(testPlatformToolsPath)

      expect(result.criticalBinariesMissing).toEqual(['adb', 'fastboot'])
      expect(result.allCriticalBinariesExecutable).toBe(false)
    })

    it('should report all critical binaries as executable when they are', async () => {
      const mockValidationResults: BinaryValidationResult[] = [
        {
          binaryName: 'adb',
          path: '/test/platform-tools/adb',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        },
        {
          binaryName: 'fastboot',
          path: '/test/platform-tools/fastboot',
          exists: true,
          isExecutable: true,
          permissions: '755',
          needsFix: false
        }
      ]

      mockAdbPermissionChecker.validateAllPlatformTools.mockResolvedValue(mockValidationResults)

      const result = await PlatformToolsValidator.validateAllBinaries(testPlatformToolsPath)

      expect(result.allCriticalBinariesExecutable).toBe(true)
      expect(result.criticalBinariesMissing).toEqual([])
    })
  })

  describe('fixBinaryPermissions', () => {
    it('should fix permissions for provided binary paths', async () => {
      const binaryPaths = ['/test/adb', '/test/fastboot']
      
      mockAdbPermissionChecker.checkAndFixPermissions
        .mockResolvedValueOnce({
          success: true,
          wasFixed: true,
          filePath: '/test/adb',
          permissions: '755'
        })
        .mockResolvedValueOnce({
          success: false,
          wasFixed: false,
          filePath: '/test/fastboot',
          error: 'Permission denied'
        })

      const result = await PlatformToolsValidator.fixBinaryPermissions(binaryPaths)

      expect(result.totalAttempted).toBe(2)
      expect(result.successfulFixes).toBe(1)
      expect(result.failedFixes).toBe(1)
      expect(result.allFixesSuccessful).toBe(false)
      expect(result.fixResults).toHaveLength(2)
    })

    it('should report all fixes successful when they are', async () => {
      const binaryPaths = ['/test/adb']
      
      mockAdbPermissionChecker.checkAndFixPermissions.mockResolvedValue({
        success: true,
        wasFixed: true,
        filePath: '/test/adb',
        permissions: '755'
      })

      const result = await PlatformToolsValidator.fixBinaryPermissions(binaryPaths)

      expect(result.allFixesSuccessful).toBe(true)
      expect(result.failedFixes).toBe(0)
    })
  })

  describe('identifyBinariesNeedingFix', () => {
    it('should return paths of binaries that need fixing', () => {
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

      const result = PlatformToolsValidator.identifyBinariesNeedingFix(validationResults)

      expect(result).toEqual(['/test/fastboot'])
    })

    it('should return empty array when no binaries need fixing', () => {
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

      const result = PlatformToolsValidator.identifyBinariesNeedingFix(validationResults)

      expect(result).toEqual([])
    })
  })

  describe('isPlatformToolsDirectoryValid', () => {
    it('should return true for valid platform-tools directory', async () => {
      // Mock fs.stat to return directory stats
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      // Mock fs.access to succeed for critical binaries
      mockFsPromises.access.mockResolvedValue(undefined)

      const result = await PlatformToolsValidator.isPlatformToolsDirectoryValid(testPlatformToolsPath)

      expect(result).toBe(true)
    })

    it('should return false when directory does not exist', async () => {
      mockFsPromises.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'))

      const result = await PlatformToolsValidator.isPlatformToolsDirectoryValid(testPlatformToolsPath)

      expect(result).toBe(false)
    })

    it('should return false when path is not a directory', async () => {
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => false
      } as any)

      const result = await PlatformToolsValidator.isPlatformToolsDirectoryValid(testPlatformToolsPath)

      expect(result).toBe(false)
    })

    it('should return false when critical binaries are missing', async () => {
      mockFsPromises.stat.mockResolvedValue({
        isDirectory: () => true
      } as any)

      // Mock fs.access to fail for adb (critical binary)
      mockFsPromises.access
        .mockRejectedValueOnce(new Error('ENOENT: no such file or directory')) // adb missing
        .mockResolvedValueOnce(undefined) // fastboot exists

      const result = await PlatformToolsValidator.isPlatformToolsDirectoryValid(testPlatformToolsPath)

      expect(result).toBe(false)
    })
  })

  describe('validateAndFixPlatformTools', () => {
    it('should validate and fix platform-tools successfully', async () => {
      // Mock directory validation
      jest.spyOn(PlatformToolsValidator, 'isPlatformToolsDirectoryValid').mockResolvedValue(true)

      // Mock validation
      const mockValidationSummary: PlatformToolsValidationSummary = {
        totalBinaries: 2,
        executableBinaries: 1,
        nonExecutableBinaries: 1,
        criticalBinariesMissing: [],
        allCriticalBinariesExecutable: false,
        validationDetails: [
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
      }

      jest.spyOn(PlatformToolsValidator, 'validateAllBinaries').mockResolvedValue(mockValidationSummary)
      jest.spyOn(PlatformToolsValidator, 'identifyBinariesNeedingFix').mockReturnValue(['/test/fastboot'])
      jest.spyOn(PlatformToolsValidator, 'fixBinaryPermissions').mockResolvedValue({
        totalAttempted: 1,
        successfulFixes: 1,
        failedFixes: 0,
        fixResults: [{
          success: true,
          wasFixed: true,
          filePath: '/test/fastboot',
          permissions: '755'
        }],
        allFixesSuccessful: true
      })

      // Mock isExecutable to return true after fix
      mockAdbPermissionChecker.isExecutable.mockResolvedValue(true)

      const result = await PlatformToolsValidator.validateAndFixPlatformTools(testPlatformToolsPath)

      expect(result.isValid).toBe(true)
      expect(result.readyForUse).toBe(true)
      expect(result.validationSummary).toEqual(mockValidationSummary)
      expect(result.fixSummary).toBeDefined()
    })

    it('should return invalid when directory is not valid', async () => {
      jest.spyOn(PlatformToolsValidator, 'isPlatformToolsDirectoryValid').mockResolvedValue(false)

      const result = await PlatformToolsValidator.validateAndFixPlatformTools(testPlatformToolsPath)

      expect(result.isValid).toBe(false)
      expect(result.readyForUse).toBe(false)
      expect(result.validationSummary.criticalBinariesMissing).toEqual(['adb', 'fastboot'])
    })
  })

  describe('generateManualFixInstructions', () => {
    it('should generate manual fix instructions', () => {
      const failedBinaries = ['/test/adb', '/test/fastboot']

      const instructions = PlatformToolsValidator.generateManualFixInstructions(
        testPlatformToolsPath,
        failedBinaries
      )

      expect(instructions).toContain('chmod +x "/test/adb"')
      expect(instructions).toContain('chmod +x "/test/fastboot"')
      expect(instructions).toContain('chmod +x "/test/platform-tools"/*')
      expect(instructions).toContain('Puis redémarrez l\'application')
    })
  })
})