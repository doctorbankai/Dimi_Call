import { BrowserWindow } from 'electron'

export interface AdbError {
  code: string
  message: string
  originalError?: Error
  adbPath?: string
  suggestions?: string[]
}

export interface AdbErrorNotification {
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  details?: string
  actions?: Array<{
    label: string
    action: string
  }>
}

export class AdbErrorHandler {
  private static readonly ERROR_CODES = {
    BINARY_NOT_FOUND: 'ADB_BINARY_NOT_FOUND',
    PERMISSION_DENIED: 'ADB_PERMISSION_DENIED',
    NOT_EXECUTABLE: 'ADB_NOT_EXECUTABLE',
    DEVICE_NOT_FOUND: 'ADB_DEVICE_NOT_FOUND',
    SERVER_NOT_RUNNING: 'ADB_SERVER_NOT_RUNNING',
    COMMAND_FAILED: 'ADB_COMMAND_FAILED',
    PLATFORM_TOOLS_INVALID: 'ADB_PLATFORM_TOOLS_INVALID',
    FIX_FAILED: 'ADB_FIX_FAILED'
  }

  private static readonly ERROR_MESSAGES = {
    [this.ERROR_CODES.BINARY_NOT_FOUND]: 'Binaire ADB non trouvé',
    [this.ERROR_CODES.PERMISSION_DENIED]: 'Permissions insuffisantes pour ADB',
    [this.ERROR_CODES.NOT_EXECUTABLE]: 'Le binaire ADB n\'est pas exécutable',
    [this.ERROR_CODES.DEVICE_NOT_FOUND]: 'Aucun appareil Android détecté',
    [this.ERROR_CODES.SERVER_NOT_RUNNING]: 'Le serveur ADB n\'est pas démarré',
    [this.ERROR_CODES.COMMAND_FAILED]: 'Commande ADB échouée',
    [this.ERROR_CODES.PLATFORM_TOOLS_INVALID]: 'Platform-tools invalide ou corrompu',
    [this.ERROR_CODES.FIX_FAILED]: 'Impossible de corriger automatiquement les permissions ADB'
  }

  /**
   * Analyse une erreur ADB et retourne un objet d'erreur structuré
   */
  static analyzeError(error: Error | string, adbPath?: string): AdbError {
    const errorMessage = typeof error === 'string' ? error : error.message
    const originalError = typeof error === 'string' ? undefined : error

    // Analyser le type d'erreur basé sur le message
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      return {
        code: this.ERROR_CODES.BINARY_NOT_FOUND,
        message: this.ERROR_MESSAGES[this.ERROR_CODES.BINARY_NOT_FOUND],
        originalError,
        adbPath,
        suggestions: [
          'Vérifiez que les platform-tools sont correctement installés',
          'Redémarrez l\'application',
          'Réinstallez l\'application si le problème persiste'
        ]
      }
    }

    if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      return {
        code: this.ERROR_CODES.PERMISSION_DENIED,
        message: this.ERROR_MESSAGES[this.ERROR_CODES.PERMISSION_DENIED],
        originalError,
        adbPath,
        suggestions: process.platform === 'darwin' ? [
          'Exécutez la commande: chmod +x "' + (adbPath || 'chemin-vers-adb') + '"',
          'Ou utilisez le bouton "Corriger les permissions" dans les paramètres',
          'Redémarrez l\'application après correction'
        ] : [
          'Vérifiez les permissions du fichier ADB',
          'Exécutez l\'application en tant qu\'administrateur si nécessaire'
        ]
      }
    }

    if (errorMessage.includes('no devices') || errorMessage.includes('device not found')) {
      return {
        code: this.ERROR_CODES.DEVICE_NOT_FOUND,
        message: this.ERROR_MESSAGES[this.ERROR_CODES.DEVICE_NOT_FOUND],
        originalError,
        adbPath,
        suggestions: [
          'Connectez votre appareil Android via USB',
          'Activez le débogage USB sur votre appareil',
          'Autorisez la connexion sur votre appareil si demandé',
          'Vérifiez que les pilotes USB sont installés'
        ]
      }
    }

    if (errorMessage.includes('daemon not running') || errorMessage.includes('server not running')) {
      return {
        code: this.ERROR_CODES.SERVER_NOT_RUNNING,
        message: this.ERROR_MESSAGES[this.ERROR_CODES.SERVER_NOT_RUNNING],
        originalError,
        adbPath,
        suggestions: [
          'Redémarrez le serveur ADB',
          'Utilisez le bouton "Redémarrer ADB" dans l\'application',
          'Vérifiez qu\'aucun autre processus n\'utilise ADB'
        ]
      }
    }

    // Erreur générique
    return {
      code: this.ERROR_CODES.COMMAND_FAILED,
      message: this.ERROR_MESSAGES[this.ERROR_CODES.COMMAND_FAILED],
      originalError,
      adbPath,
      suggestions: [
        'Vérifiez la connexion de votre appareil',
        'Redémarrez le serveur ADB',
        'Consultez les logs pour plus de détails'
      ]
    }
  }

  /**
   * Crée une notification d'erreur pour l'interface utilisateur
   */
  static createErrorNotification(adbError: AdbError): AdbErrorNotification {
    const notification: AdbErrorNotification = {
      type: 'error',
      title: 'Erreur ADB',
      message: adbError.message,
      details: adbError.originalError?.message
    }

    // Ajouter des actions spécifiques selon le type d'erreur
    switch (adbError.code) {
      case this.ERROR_CODES.PERMISSION_DENIED:
      case this.ERROR_CODES.NOT_EXECUTABLE:
        if (process.platform === 'darwin') {
          notification.actions = [
            { label: 'Corriger automatiquement', action: 'fix-permissions' },
            { label: 'Instructions manuelles', action: 'show-manual-instructions' }
          ]
        }
        break

      case this.ERROR_CODES.SERVER_NOT_RUNNING:
        notification.actions = [
          { label: 'Redémarrer ADB', action: 'restart-adb-server' },
          { label: 'Vérifier les appareils', action: 'check-devices' }
        ]
        break

      case this.ERROR_CODES.DEVICE_NOT_FOUND:
        notification.type = 'warning'
        notification.actions = [
          { label: 'Actualiser les appareils', action: 'refresh-devices' },
          { label: 'Guide de connexion', action: 'show-connection-guide' }
        ]
        break
    }

    return notification
  }

  /**
   * Envoie une notification d'erreur à l'interface utilisateur
   */
  static notifyUser(mainWindow: BrowserWindow | null, adbError: AdbError): void {
    if (!mainWindow) {
      console.error('❌ Impossible d\'envoyer la notification: fenêtre principale non disponible')
      return
    }

    const notification = this.createErrorNotification(adbError)
    
    console.log(`📢 Envoi de notification d'erreur ADB: ${adbError.code}`)
    console.log(`   Message: ${notification.message}`)
    
    if (adbError.suggestions && adbError.suggestions.length > 0) {
      console.log(`   Suggestions:`)
      adbError.suggestions.forEach((suggestion, index) => {
        console.log(`     ${index + 1}. ${suggestion}`)
      })
    }

    // Envoyer la notification à l'interface utilisateur
    mainWindow.webContents.send('adb-error-notification', notification)
  }

  /**
   * Log une erreur ADB avec tous les détails
   */
  static logError(adbError: AdbError, context?: string): void {
    const contextStr = context ? `[${context}] ` : ''
    
    console.error(`❌ ${contextStr}Erreur ADB: ${adbError.code}`)
    console.error(`   Message: ${adbError.message}`)
    
    if (adbError.adbPath) {
      console.error(`   Chemin ADB: ${adbError.adbPath}`)
    }
    
    if (adbError.originalError) {
      console.error(`   Erreur originale: ${adbError.originalError.message}`)
      if (adbError.originalError.stack) {
        console.error(`   Stack trace: ${adbError.originalError.stack}`)
      }
    }
    
    if (adbError.suggestions && adbError.suggestions.length > 0) {
      console.error(`   Suggestions de résolution:`)
      adbError.suggestions.forEach((suggestion, index) => {
        console.error(`     ${index + 1}. ${suggestion}`)
      })
    }
  }

  /**
   * Gère une erreur ADB complètement (log + notification)
   */
  static handleError(
    error: Error | string, 
    mainWindow: BrowserWindow | null, 
    adbPath?: string, 
    context?: string
  ): AdbError {
    const adbError = this.analyzeError(error, adbPath)
    
    // Logger l'erreur
    this.logError(adbError, context)
    
    // Notifier l'utilisateur
    this.notifyUser(mainWindow, adbError)
    
    return adbError
  }

  /**
   * Crée des instructions manuelles formatées pour l'utilisateur
   */
  static formatManualInstructions(instructions: string[]): string {
    return instructions.map((instruction, index) => {
      if (instruction.startsWith('chmod')) {
        return `${index + 1}. Ouvrez le Terminal et exécutez:\n   ${instruction}`
      } else {
        return `${index + 1}. ${instruction}`
      }
    }).join('\n\n')
  }

  /**
   * Génère un rapport de diagnostic complet
   */
  static generateDiagnosticReport(adbPath: string, platformToolsPath: string): string {
    const report = [
      '=== RAPPORT DE DIAGNOSTIC ADB ===',
      '',
      `Date: ${new Date().toISOString()}`,
      `Plateforme: ${process.platform} ${process.arch}`,
      `Version Node.js: ${process.version}`,
      '',
      '--- Chemins ---',
      `Chemin ADB: ${adbPath}`,
      `Dossier platform-tools: ${platformToolsPath}`,
      '',
      '--- État des fichiers ---'
    ]

    // Cette partie sera complétée par les fonctions de validation
    // lors de l'utilisation du rapport

    return report.join('\n')
  }
}