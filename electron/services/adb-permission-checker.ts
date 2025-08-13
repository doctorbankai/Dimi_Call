import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const access = promisify(fs.access)
const chmod = promisify(fs.chmod)
const stat = promisify(fs.stat)

export interface PermissionCheckResult {
  success: boolean
  wasFixed: boolean
  error?: string
  permissions?: string
  filePath: string
}

export interface BinaryValidationResult {
  binaryName: string
  path: string
  exists: boolean
  isExecutable: boolean
  permissions: string
  needsFix: boolean
}

export class AdbPermissionChecker {
  /**
   * Vérifie si un fichier est exécutable
   */
  static async isExecutable(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.F_OK | fs.constants.X_OK)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Rend un fichier exécutable
   */
  static async makeExecutable(filePath: string): Promise<boolean> {
    try {
      // Obtenir les permissions actuelles
      const stats = await stat(filePath)
      const currentMode = stats.mode
      
      // Ajouter les permissions d'exécution (0o755 = rwxr-xr-x)
      const newMode = currentMode | 0o755
      
      await chmod(filePath, newMode)
      console.log(`✅ Permissions d'exécution ajoutées à: ${filePath}`)
      return true
    } catch (error) {
      console.error(`❌ Impossible de rendre exécutable: ${filePath}`, error)
      return false
    }
  }

  /**
   * Obtient les permissions d'un fichier en format lisible
   */
  static async getFilePermissions(filePath: string): Promise<string> {
    try {
      const stats = await stat(filePath)
      const mode = stats.mode
      
      // Convertir en format octal lisible
      const permissions = (mode & parseInt('777', 8)).toString(8)
      return permissions
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Vérifie et corrige les permissions d'un binaire ADB
   */
  static async checkAndFixPermissions(adbPath: string): Promise<PermissionCheckResult> {
    const result: PermissionCheckResult = {
      success: false,
      wasFixed: false,
      filePath: adbPath
    }

    try {
      // Vérifier si le fichier existe
      await access(adbPath, fs.constants.F_OK)
      
      // Obtenir les permissions actuelles
      result.permissions = await this.getFilePermissions(adbPath)
      
      // Vérifier si le fichier est exécutable
      const isExecutable = await this.isExecutable(adbPath)
      
      if (isExecutable) {
        result.success = true
        console.log(`✅ Binaire ADB déjà exécutable: ${adbPath} (${result.permissions})`)
        return result
      }

      // Tenter de corriger les permissions
      console.log(`🔧 Correction des permissions pour: ${adbPath} (${result.permissions})`)
      const fixSuccessful = await this.makeExecutable(adbPath)
      
      if (fixSuccessful) {
        // Vérifier que la correction a fonctionné
        const isNowExecutable = await this.isExecutable(adbPath)
        if (isNowExecutable) {
          result.success = true
          result.wasFixed = true
          result.permissions = await this.getFilePermissions(adbPath)
          console.log(`✅ Permissions corrigées avec succès: ${adbPath} (${result.permissions})`)
        } else {
          result.error = 'La correction des permissions a échoué à la vérification'
        }
      } else {
        result.error = 'Impossible de modifier les permissions du fichier'
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          result.error = `Fichier binaire ADB non trouvé: ${adbPath}`
        } else if (error.message.includes('EACCES')) {
          result.error = `Permissions insuffisantes pour modifier: ${adbPath}`
        } else if (error.message.includes('EPERM')) {
          result.error = `Opération non autorisée sur: ${adbPath}`
        } else {
          result.error = `Erreur lors de la vérification des permissions: ${error.message}`
        }
      } else {
        result.error = 'Erreur inconnue lors de la vérification des permissions'
      }
      console.error(`❌ ${result.error}`)
    }

    return result
  }

  /**
   * Valide tous les binaires dans le dossier platform-tools
   */
  static async validateAllPlatformTools(platformToolsPath: string): Promise<BinaryValidationResult[]> {
    const results: BinaryValidationResult[] = []
    
    try {
      const files = await fs.promises.readdir(platformToolsPath)
      
      // Liste des binaires importants à vérifier
      const importantBinaries = ['adb', 'fastboot', 'etc1tool', 'hprof-conv', 'make_f2fs', 'mke2fs', 'sqlite3']
      
      for (const file of files) {
        const filePath = path.join(platformToolsPath, file)
        
        try {
          const stats = await stat(filePath)
          
          // Ignorer les dossiers et fichiers de configuration
          if (stats.isDirectory() || file.endsWith('.conf') || file.endsWith('.txt') || file.endsWith('.properties')) {
            continue
          }

          const result: BinaryValidationResult = {
            binaryName: file,
            path: filePath,
            exists: true,
            isExecutable: await this.isExecutable(filePath),
            permissions: await this.getFilePermissions(filePath),
            needsFix: false
          }

          // Déterminer si ce binaire a besoin d'être corrigé
          result.needsFix = !result.isExecutable && (
            importantBinaries.includes(file) || 
            !file.includes('.') // Fichiers sans extension sont probablement des binaires
          )

          results.push(result)
          
        } catch (error) {
          // Fichier inaccessible
          results.push({
            binaryName: file,
            path: filePath,
            exists: false,
            isExecutable: false,
            permissions: 'unknown',
            needsFix: false
          })
        }
      }
      
    } catch (error) {
      console.error(`❌ Impossible de lire le dossier platform-tools: ${platformToolsPath}`, error)
    }

    return results
  }

  /**
   * Corrige les permissions de tous les binaires qui en ont besoin
   */
  static async fixAllBinaryPermissions(validationResults: BinaryValidationResult[]): Promise<PermissionCheckResult[]> {
    const results: PermissionCheckResult[] = []
    
    const binariesToFix = validationResults.filter(result => result.needsFix)
    
    if (binariesToFix.length === 0) {
      console.log('✅ Aucun binaire ne nécessite de correction de permissions')
      return results
    }

    console.log(`🔧 Correction des permissions pour ${binariesToFix.length} binaires...`)
    
    for (const binary of binariesToFix) {
      const result = await this.checkAndFixPermissions(binary.path)
      results.push(result)
    }

    return results
  }

  /**
   * Fonction principale pour valider et corriger tous les binaires platform-tools
   */
  static async validateAndFixAllBinaries(platformToolsPath: string): Promise<{
    validationResults: BinaryValidationResult[]
    fixResults: PermissionCheckResult[]
    allFixed: boolean
  }> {
    console.log(`🔍 Validation des binaires platform-tools: ${platformToolsPath}`)
    
    const validationResults = await this.validateAllPlatformTools(platformToolsPath)
    const fixResults = await this.fixAllBinaryPermissions(validationResults)
    
    const allFixed = fixResults.every(result => result.success)
    
    // Résumé des résultats
    const totalBinaries = validationResults.length
    const executableBinaries = validationResults.filter(r => r.isExecutable).length
    const fixedBinaries = fixResults.filter(r => r.success && r.wasFixed).length
    const failedFixes = fixResults.filter(r => !r.success).length
    
    console.log(`📊 Résumé de validation:`)
    console.log(`   - Total binaires: ${totalBinaries}`)
    console.log(`   - Déjà exécutables: ${executableBinaries}`)
    console.log(`   - Corrigés avec succès: ${fixedBinaries}`)
    console.log(`   - Échecs de correction: ${failedFixes}`)
    
    return {
      validationResults,
      fixResults,
      allFixed
    }
  }
}