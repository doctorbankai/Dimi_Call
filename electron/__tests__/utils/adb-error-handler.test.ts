import { BrowserWindow } from 'electron'
import { AdbErrorHandler, AdbError, AdbErrorNotification } from '../../utils/adb-error-handler'

// Mock Electron
jest.mock('electron', () => ({
  BrowserWindow: {
    prototype: {
      webContents: {
        send: jest.fn()
      }
    }
  }
}))

describe('AdbErrorHandler', () => {
  let mockMainWindow: jest.Mocked<BrowserWindow>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    mockMainWindow = {
      webContents: {
        send: jest.fn()
      }
    } as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('analyzeError', () => {
    it('should identify binary not found error', () => {
      const error = new Error('ENOENT: no such file or directory')
      const adbPath = '/test/adb'

      const result = AdbErrorHandler.analyzeError(error, adbPath)

      expect(result.code).toBe('ADB_BINARY_NOT_FOUND')
      expect(result.message).toBe('Binaire ADB non trouvé')
      expect(result.adbPath).toBe(adbPath)
      expect(result.originalError).toBe(error)
      expect(result.suggestions).toContain('Vérifiez que les platform-tools sont correctement installés')
    })

    it('should identify permission denied error', () => {
      const error = new Error('EACCES: permission denied')
      const adbPath = '/test/adb'

      const result = AdbErrorHandler.analyzeError(error, adbPath)

      expect(result.code).toBe('ADB_PERMISSION_DENIED')
      expect(result.message).toBe('Permissions insuffisantes pour ADB')
      expect(result.suggestions).toContain('Exécutez la commande: chmod +x "/test/adb"')
    })

    it('should identify device not found error', () => {
      const error = new Error('no devices/emulators found')

      const result = AdbErrorHandler.analyzeError(error)

      expect(result.code).toBe('ADB_DEVICE_NOT_FOUND')
      expect(result.message).toBe('Aucun appareil Android détecté')
      expect(result.suggestions).toContain('Connectez votre appareil Android via USB')
    })

    it('should identify server not running error', () => {
      const error = new Error('daemon not running; starting now')

      const result = AdbErrorHandler.analyzeError(error)

      expect(result.code).toBe('ADB_SERVER_NOT_RUNNING')
      expect(result.message).toBe('Le serveur ADB n\'est pas démarré')
      expect(result.suggestions).toContain('Redémarrez le serveur ADB')
    })

    it('should handle string errors', () => {
      const errorMessage = 'ENOENT: file not found'

      const result = AdbErrorHandler.analyzeError(errorMessage)

      expect(result.code).toBe('ADB_BINARY_NOT_FOUND')
      expect(result.originalError).toBeUndefined()
    })

    it('should return generic error for unknown errors', () => {
      const error = new Error('Unknown error occurred')

      const result = AdbErrorHandler.analyzeError(error)

      expect(result.code).toBe('ADB_COMMAND_FAILED')
      expect(result.message).toBe('Commande ADB échouée')
      expect(result.suggestions).toContain('Vérifiez la connexion de votre appareil')
    })
  })

  describe('createErrorNotification', () => {
    it('should create error notification with actions for permission errors', () => {
      const adbError: AdbError = {
        code: 'ADB_PERMISSION_DENIED',
        message: 'Permissions insuffisantes pour ADB',
        adbPath: '/test/adb'
      }

      // Mock process.platform to be darwin
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })

      const result = AdbErrorHandler.createErrorNotification(adbError)

      expect(result.type).toBe('error')
      expect(result.title).toBe('Erreur ADB')
      expect(result.message).toBe('Permissions insuffisantes pour ADB')
      expect(result.actions).toEqual([
        { label: 'Corriger automatiquement', action: 'fix-permissions' },
        { label: 'Instructions manuelles', action: 'show-manual-instructions' }
      ])
    })

    it('should create warning notification for device not found', () => {
      const adbError: AdbError = {
        code: 'ADB_DEVICE_NOT_FOUND',
        message: 'Aucun appareil Android détecté'
      }

      const result = AdbErrorHandler.createErrorNotification(adbError)

      expect(result.type).toBe('warning')
      expect(result.actions).toEqual([
        { label: 'Actualiser les appareils', action: 'refresh-devices' },
        { label: 'Guide de connexion', action: 'show-connection-guide' }
      ])
    })

    it('should create notification with server restart actions', () => {
      const adbError: AdbError = {
        code: 'ADB_SERVER_NOT_RUNNING',
        message: 'Le serveur ADB n\'est pas démarré'
      }

      const result = AdbErrorHandler.createErrorNotification(adbError)

      expect(result.actions).toEqual([
        { label: 'Redémarrer ADB', action: 'restart-adb-server' },
        { label: 'Vérifier les appareils', action: 'check-devices' }
      ])
    })
  })

  describe('notifyUser', () => {
    it('should send notification to main window', () => {
      const adbError: AdbError = {
        code: 'ADB_PERMISSION_DENIED',
        message: 'Permissions insuffisantes pour ADB',
        suggestions: ['Suggestion 1', 'Suggestion 2']
      }

      AdbErrorHandler.notifyUser(mockMainWindow, adbError)

      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
        'adb-error-notification',
        expect.objectContaining({
          type: 'error',
          title: 'Erreur ADB',
          message: 'Permissions insuffisantes pour ADB'
        })
      )
    })

    it('should handle null main window gracefully', () => {
      const adbError: AdbError = {
        code: 'ADB_PERMISSION_DENIED',
        message: 'Permissions insuffisantes pour ADB'
      }

      AdbErrorHandler.notifyUser(null, adbError)

      expect(console.error).toHaveBeenCalledWith(
        '❌ Impossible d\'envoyer la notification: fenêtre principale non disponible'
      )
    })
  })

  describe('logError', () => {
    it('should log error with all details', () => {
      const adbError: AdbError = {
        code: 'ADB_PERMISSION_DENIED',
        message: 'Permissions insuffisantes pour ADB',
        adbPath: '/test/adb',
        originalError: new Error('Original error'),
        suggestions: ['Suggestion 1', 'Suggestion 2']
      }

      AdbErrorHandler.logError(adbError, 'test-context')

      expect(console.error).toHaveBeenCalledWith('❌ [test-context] Erreur ADB: ADB_PERMISSION_DENIED')
      expect(console.error).toHaveBeenCalledWith('   Message: Permissions insuffisantes pour ADB')
      expect(console.error).toHaveBeenCalledWith('   Chemin ADB: /test/adb')
      expect(console.error).toHaveBeenCalledWith('   Erreur originale: Original error')
      expect(console.error).toHaveBeenCalledWith('   Suggestions de résolution:')
      expect(console.error).toHaveBeenCalledWith('     1. Suggestion 1')
      expect(console.error).toHaveBeenCalledWith('     2. Suggestion 2')
    })

    it('should log error without optional fields', () => {
      const adbError: AdbError = {
        code: 'ADB_COMMAND_FAILED',
        message: 'Commande ADB échouée'
      }

      AdbErrorHandler.logError(adbError)

      expect(console.error).toHaveBeenCalledWith('❌ Erreur ADB: ADB_COMMAND_FAILED')
      expect(console.error).toHaveBeenCalledWith('   Message: Commande ADB échouée')
      // Should not log optional fields that are undefined
      expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('Chemin ADB:'))
    })
  })

  describe('handleError', () => {
    it('should analyze, log, and notify for an error', () => {
      const error = new Error('EACCES: permission denied')
      const adbPath = '/test/adb'
      const context = 'test-operation'

      const result = AdbErrorHandler.handleError(error, mockMainWindow, adbPath, context)

      expect(result.code).toBe('ADB_PERMISSION_DENIED')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[test-operation] Erreur ADB: ADB_PERMISSION_DENIED')
      )
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
        'adb-error-notification',
        expect.any(Object)
      )
    })
  })

  describe('formatManualInstructions', () => {
    it('should format chmod instructions specially', () => {
      const instructions = [
        'chmod +x "/test/adb"',
        'Redémarrez l\'application'
      ]

      const result = AdbErrorHandler.formatManualInstructions(instructions)

      expect(result).toContain('1. Ouvrez le Terminal et exécutez:\n   chmod +x "/test/adb"')
      expect(result).toContain('2. Redémarrez l\'application')
    })

    it('should format regular instructions normally', () => {
      const instructions = [
        'Vérifiez la connexion',
        'Redémarrez l\'application'
      ]

      const result = AdbErrorHandler.formatManualInstructions(instructions)

      expect(result).toContain('1. Vérifiez la connexion')
      expect(result).toContain('2. Redémarrez l\'application')
    })
  })

  describe('generateDiagnosticReport', () => {
    it('should generate diagnostic report with system information', () => {
      const adbPath = '/test/adb'
      const platformToolsPath = '/test/platform-tools'

      const result = AdbErrorHandler.generateDiagnosticReport(adbPath, platformToolsPath)

      expect(result).toContain('=== RAPPORT DE DIAGNOSTIC ADB ===')
      expect(result).toContain(`Plateforme: ${process.platform} ${process.arch}`)
      expect(result).toContain(`Version Node.js: ${process.version}`)
      expect(result).toContain(`Chemin ADB: ${adbPath}`)
      expect(result).toContain(`Dossier platform-tools: ${platformToolsPath}`)
    })
  })
})