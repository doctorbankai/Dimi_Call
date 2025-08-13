const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Script afterPack pour Electron Builder
 * Corrige automatiquement les permissions des binaires ADB sur macOS
 */

// Liste des binaires qui doivent être exécutables
const EXECUTABLE_BINARIES = [
  'adb',
  'fastboot',
  'etc1tool',
  'hprof-conv',
  'make_f2fs',
  'make_f2fs_casefold',
  'mke2fs',
  'sqlite3'
]

/**
 * Vérifie si un fichier est exécutable
 */
function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK | fs.constants.X_OK)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Rend un fichier exécutable
 */
function makeExecutable(filePath) {
  try {
    const stats = fs.statSync(filePath)
    const currentMode = stats.mode
    const newMode = currentMode | 0o755 // rwxr-xr-x
    
    fs.chmodSync(filePath, newMode)
    console.log(`✅ Permissions d'exécution ajoutées: ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Impossible de rendre exécutable: ${filePath}`, error.message)
    return false
  }
}

/**
 * Corrige les permissions de tous les binaires dans un dossier
 */
function fixBinaryPermissions(platformToolsPath) {
  console.log(`🔧 Correction des permissions dans: ${platformToolsPath}`)
  
  if (!fs.existsSync(platformToolsPath)) {
    console.log(`⚠️ Dossier platform-tools non trouvé: ${platformToolsPath}`)
    return false
  }

  let totalFixed = 0
  let totalErrors = 0

  // Parcourir tous les binaires connus
  for (const binaryName of EXECUTABLE_BINARIES) {
    const binaryPath = path.join(platformToolsPath, binaryName)
    
    if (fs.existsSync(binaryPath)) {
      if (!isExecutable(binaryPath)) {
        console.log(`🔧 Correction des permissions pour: ${binaryName}`)
        if (makeExecutable(binaryPath)) {
          totalFixed++
        } else {
          totalErrors++
        }
      } else {
        console.log(`✅ ${binaryName} déjà exécutable`)
      }
    } else {
      console.log(`ℹ️ Binaire optionnel non trouvé: ${binaryName}`)
    }
  }

  // Parcourir tous les autres fichiers du dossier pour identifier d'autres binaires potentiels
  try {
    const files = fs.readdirSync(platformToolsPath)
    
    for (const file of files) {
      const filePath = path.join(platformToolsPath, file)
      const stats = fs.statSync(filePath)
      
      // Ignorer les dossiers et fichiers de configuration
      if (stats.isDirectory() || 
          file.endsWith('.conf') || 
          file.endsWith('.txt') || 
          file.endsWith('.properties') ||
          file.endsWith('.dll')) {
        continue
      }

      // Si ce n'est pas dans notre liste connue et n'a pas d'extension, c'est probablement un binaire
      if (!EXECUTABLE_BINARIES.includes(file) && !file.includes('.')) {
        if (!isExecutable(filePath)) {
          console.log(`🔧 Correction des permissions pour binaire détecté: ${file}`)
          if (makeExecutable(filePath)) {
            totalFixed++
          } else {
            totalErrors++
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors du parcours du dossier: ${error.message}`)
    totalErrors++
  }

  console.log(`📊 Résumé des corrections:`)
  console.log(`   - Binaires corrigés: ${totalFixed}`)
  console.log(`   - Erreurs: ${totalErrors}`)

  return totalErrors === 0
}

/**
 * Fonction principale appelée par Electron Builder
 */
async function afterPack(context) {
  const { electronPlatformName, appOutDir } = context
  
  console.log(`🚀 Script afterPack exécuté pour: ${electronPlatformName}`)
  console.log(`📁 Dossier de sortie: ${appOutDir}`)

  // Ne s'exécuter que sur macOS
  if (electronPlatformName !== 'darwin') {
    console.log(`ℹ️ Script ignoré (plateforme: ${electronPlatformName})`)
    return
  }

  try {
    // Trouver le dossier platform-tools dans les ressources
    const resourcesPath = path.join(appOutDir, 'DimiCall.app', 'Contents', 'Resources')
    const platformToolsPath = path.join(resourcesPath, 'platform-tools')
    
    console.log(`🔍 Recherche de platform-tools dans: ${platformToolsPath}`)
    
    if (!fs.existsSync(platformToolsPath)) {
      // Essayer d'autres emplacements possibles
      const alternativePaths = [
        path.join(appOutDir, 'DimiCall.app', 'Contents', 'Resources', 'app.asar.unpacked', 'platform-tools'),
        path.join(appOutDir, 'DimiCall.app', 'Contents', 'Resources', 'app', 'platform-tools'),
        path.join(resourcesPath, 'extraResources', 'platform-tools')
      ]
      
      let foundPath = null
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          foundPath = altPath
          break
        }
      }
      
      if (foundPath) {
        console.log(`✅ Platform-tools trouvé dans: ${foundPath}`)
        fixBinaryPermissions(foundPath)
      } else {
        console.log(`❌ Dossier platform-tools non trouvé dans les emplacements suivants:`)
        console.log(`   - ${platformToolsPath}`)
        alternativePaths.forEach(p => console.log(`   - ${p}`))
        
        // Lister le contenu du dossier Resources pour diagnostic
        console.log(`📋 Contenu du dossier Resources:`)
        try {
          const resourcesContent = fs.readdirSync(resourcesPath)
          resourcesContent.forEach(item => {
            const itemPath = path.join(resourcesPath, item)
            const isDir = fs.statSync(itemPath).isDirectory()
            console.log(`   ${isDir ? '📁' : '📄'} ${item}`)
          })
        } catch (error) {
          console.log(`   ❌ Impossible de lister le contenu: ${error.message}`)
        }
      }
    } else {
      console.log(`✅ Platform-tools trouvé: ${platformToolsPath}`)
      fixBinaryPermissions(platformToolsPath)
    }

    console.log(`✅ Script afterPack terminé avec succès`)

  } catch (error) {
    console.error(`❌ Erreur dans le script afterPack:`, error)
    // Ne pas faire échouer le build, juste logger l'erreur
  }
}

// Export pour Electron Builder
module.exports = afterPack

// Si exécuté directement (pour tests)
if (require.main === module) {
  console.log('🧪 Test du script de correction des permissions')
  
  // Simuler un contexte Electron Builder pour test
  const testContext = {
    electronPlatformName: 'darwin',
    appOutDir: process.argv[2] || './test-app-out'
  }
  
  afterPack(testContext).then(() => {
    console.log('✅ Test terminé')
  }).catch(error => {
    console.error('❌ Test échoué:', error)
    process.exit(1)
  })
}