import * as fs from 'fs'
import * as path from 'path'
import { AdbPermissionChecker, BinaryValidationResult, PermissionCheckResult } from '../services/adb-permission-checker'

export interface PlatformToolsValidationSummary {
  totalBinaries: number
  executableBinaries: number
  nonExecutableBinaries: number
  criticalBinariesMissing: string[]
  allCriticalBinariesExecutable: boolean
  validationDetails: BinaryValidationResult[]
}

export interface PermissionFixSummary {
  totalAttempted: number
  successfulFixes: number
  failedFixes: number
  fixResults: PermissionCheckResult[]
  allFixesSuccessful: boolean
}

export class PlatformToolsValidator {
  // Liste des binaires critiques pour le fonctionnement d'ADB
  private static readonly CRITICAL_BINARIES = [
    'adb',
    'fastboot'
  ]

  // Liste des binaires optionnels mais utiles
  private static readonly OPTIONAL_BINARIES = [
    'etc1tool',
    'hprof-conv',
    'make_f2fs',
    'make_f2fs_casefold',
    'mke2fs',
    'sqlite3'
  ]

  /**
   * Valide tous les binaires dans le dossier platform-tools
   */
  static async validateAllBinaries(toolsPath: string): Promise<PlatformToolsValidationSummary> {
    console.log(`🔍 Validation complète des platform-tools: ${toolsPath}`)

    const validationResults = await AdbPermissionChecker.validateAllPlatformTools(toolsPath)
    
    const executableBinaries = validationResults.filter(r => r.isExecutable).length
    const nonExecutableBinaries = validationResults.filter(r => r.exists && !r.isExecutable).length
    
    // Vérifier les binaires critiques
    const criticalBinariesMissing: string[] = []
    let allCriticalBinariesExecutable = true

    for (const criticalBinary of this.CRITICAL_BINARIES) {
      const binaryResult = validationResults.find(r => r.binaryName === criticalBinary)
      
      if (!binaryResult || !binaryResult.exists) {
        criticalBinariesMissing.push(criticalBinary)
        allCriticalBinariesExecutable = false
      } else if (!binaryResult.isExecutable) {
        allCriticalBinariesExecutable = false
      }
    }

    const summary: PlatformToolsValidationSummary = {
      totalBinaries: validationResults.length,
      executableBinaries,
      nonExecutableBinaries,
      criticalBinariesMissing,
      allCriticalBinariesExecutable,
      validationDetails: validationResults
    }

    // Log du résumé
    console.log(`📊 Résumé de validation platform-tools:`)
    console.log(`   - Total binaires trouvés: ${summary.totalBinaries}`)
    console.log(`   - Binaires exécutables: ${summary.executableBinaries}`)
    console.log(`   - Binaires non-exécutables: ${summary.nonExecutableBinaries}`)
    
    if (summary.criticalBinariesMissing.length > 0) {
      console.log(`   ❌ Binaires critiques manquants: ${summary.criticalBinariesMissing.join(', ')}`)
    }
    
    if (summary.allCriticalBinariesExecutable) {
      console.log(`   ✅ Tous les binaires critiques sont exécutables`)
    } else {
      console.log(`   ⚠️ Certains binaires critiques ne sont pas exécutables`)
    }

    return summary
  }

  /**
   * Corrige les permissions de tous les binaires qui en ont besoin
   */
  static async fixBinaryPermissions(binariesPaths: string[]): Promise<PermissionFixSummary> {
    console.log(`🔧 Correction des permissions pour ${binariesPaths.length} binaires...`)

    const fixResults: PermissionCheckResult[] = []

    for (const binaryPath of binariesPaths) {
      const result = await AdbPermissionChecker.checkAndFixPermissions(binaryPath)
      fixResults.push(result)
    }

    const successfulFixes = fixResults.filter(r => r.success && r.wasFixed).length
    const failedFixes = fixResults.filter(r => !r.success).length
    const allFixesSuccessful = failedFixes === 0

    const summary: PermissionFixSummary = {
      totalAttempted: binariesPaths.length,
      successfulFixes,
      failedFixes,
      fixResults,
      allFixesSuccessful
    }

    // Log du résumé
    console.log(`📊 Résumé des corrections de permissions:`)
    console.log(`   - Total tentatives: ${summary.totalAttempted}`)
    console.log(`   - Corrections réussies: ${summary.successfulFixes}`)
    console.log(`   - Corrections échouées: ${summary.failedFixes}`)
    
    if (summary.allFixesSuccessful) {
      console.log(`   ✅ Toutes les corrections ont réussi`)
    } else {
      console.log(`   ⚠️ Certaines corrections ont échoué`)
      
      // Détailler les échecs
      const failures = fixResults.filter(r => !r.success)
      failures.forEach(failure => {
        console.log(`     ❌ ${failure.filePath}: ${failure.error}`)
      })
    }

    return summary
  }

  /**
   * Obtient les permissions actuelles d'un fichier en format lisible
   */
  static async getCurrentPermissions(filePath: string): Promise<string> {
    return await AdbPermissionChecker.getFilePermissions(filePath)
  }

  /**
   * Identifie quels binaires ont besoin d'une correction de permissions
   */
  static identifyBinariesNeedingFix(validationResults: BinaryValidationResult[]): string[] {
    return validationResults
      .filter(result => result.needsFix)
      .map(result => result.path)
  }

  /**
   * Vérifie si un dossier platform-tools est valide
   */
  static async isPlatformToolsDirectoryValid(toolsPath: string): Promise<boolean> {
    try {
      // Vérifier que le dossier existe
      const stats = await fs.promises.stat(toolsPath)
      if (!stats.isDirectory()) {
        return false
      }

      // Vérifier que les binaires critiques existent
      for (const criticalBinary of this.CRITICAL_BINARIES) {
        const binaryPath = path.join(toolsPath, criticalBinary)
        try {
          await fs.promises.access(binaryPath, fs.constants.F_OK)
        } catch {
          console.log(`❌ Binaire critique manquant: ${criticalBinary}`)
          return false
        }
      }

      return true
    } catch (error) {
      console.error(`❌ Erreur lors de la validation du dossier platform-tools: ${toolsPath}`, error)
      return false
    }
  }

  /**
   * Fonction principale pour valider et corriger un dossier platform-tools complet
   */
  static async validateAndFixPlatformTools(toolsPath: string): Promise<{
    isValid: boolean
    validationSummary: PlatformToolsValidationSummary
    fixSummary?: PermissionFixSummary
    readyForUse: boolean
  }> {
    console.log(`🚀 Validation et correction complète de platform-tools: ${toolsPath}`)

    // Étape 1: Vérifier que le dossier est valide
    const isValid = await this.isPlatformToolsDirectoryValid(toolsPath)
    if (!isValid) {
      return {
        isValid: false,
        validationSummary: {
          totalBinaries: 0,
          executableBinaries: 0,
          nonExecutableBinaries: 0,
          criticalBinariesMissing: this.CRITICAL_BINARIES,
          allCriticalBinariesExecutable: false,
          validationDetails: []
        },
        readyForUse: false
      }
    }

    // Étape 2: Valider tous les binaires
    const validationSummary = await this.validateAllBinaries(toolsPath)

    // Étape 3: Corriger les permissions si nécessaire
    let fixSummary: PermissionFixSummary | undefined
    let readyForUse = validationSummary.allCriticalBinariesExecutable

    if (!readyForUse) {
      const binariesNeedingFix = this.identifyBinariesNeedingFix(validationSummary.validationDetails)
      
      if (binariesNeedingFix.length > 0) {
        fixSummary = await this.fixBinaryPermissions(binariesNeedingFix)
        
        // Re-vérifier les binaires critiques après correction
        const criticalBinariesFixed = await Promise.all(
          this.CRITICAL_BINARIES.map(async (binaryName) => {
            const binaryPath = path.join(toolsPath, binaryName)
            return await AdbPermissionChecker.isExecutable(binaryPath)
          })
        )
        
        readyForUse = criticalBinariesFixed.every(isExecutable => isExecutable)
      }
    }

    // Résumé final
    if (readyForUse) {
      console.log(`✅ Platform-tools prêt à l'utilisation: ${toolsPath}`)
    } else {
      console.log(`❌ Platform-tools nécessite une intervention manuelle: ${toolsPath}`)
    }

    return {
      isValid,
      validationSummary,
      fixSummary,
      readyForUse
    }
  }

  /**
   * Génère des instructions manuelles pour l'utilisateur en cas d'échec
   */
  static generateManualFixInstructions(toolsPath: string, failedBinaries: string[]): string[] {
    const instructions: string[] = [
      'Les permissions ADB n\'ont pas pu être corrigées automatiquement.',
      'Veuillez exécuter les commandes suivantes dans le Terminal:',
      ''
    ]

    failedBinaries.forEach(binaryPath => {
      instructions.push(`chmod +x "${binaryPath}"`)
    })

    instructions.push('')
    instructions.push('Ou pour corriger tous les binaires d\'un coup:')
    instructions.push(`chmod +x "${toolsPath}"/*`)
    instructions.push('')
    instructions.push('Puis redémarrez l\'application.')

    return instructions
  }
}