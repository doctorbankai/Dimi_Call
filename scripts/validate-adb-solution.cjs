#!/usr/bin/env node

/**
 * Script de validation complète de la solution ADB
 * Teste tous les aspects de la solution de permissions ADB
 */

const fs = require('fs')
const path = require('path')

// Import des modules de test
const testAdbPermissions = require('./test-adb-permissions')

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  }
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function validateFileStructure() {
  log('\n🔍 Validation de la structure des fichiers', 'cyan')
  
  const requiredFiles = [
    'electron/services/adb-permission-checker.ts',
    'electron/utils/platform-tools-validator.ts',
    'electron/utils/adb-error-handler.ts',
    'scripts/fix-macos-permissions.js',
    'electron/__tests__/services/adb-permission-checker.test.ts',
    'electron/__tests__/utils/platform-tools-validator.test.ts',
    'electron/__tests__/utils/adb-error-handler.test.ts',
    'electron/__tests__/integration/adb-permissions-integration.test.ts'
  ]
  
  let allFilesExist = true
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath)
    const exists = fs.existsSync(fullPath)
    
    if (exists) {
      log(`✅ ${filePath}`, 'green')
    } else {
      log(`❌ ${filePath}`, 'red')
      allFilesExist = false
    }
  })
  
  return allFilesExist
}

function validatePackageJsonConfiguration() {
  log('\n📦 Validation de la configuration package.json', 'cyan')
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json non trouvé', 'red')
    return false
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  // Vérifier la configuration Electron Builder pour macOS
  const macConfig = packageJson.build?.mac
  
  if (!macConfig) {
    log('❌ Configuration macOS manquante dans package.json', 'red')
    return false
  }
  
  // Vérifier afterPack
  if (macConfig.afterPack === 'scripts/fix-macos-permissions.js') {
    log('✅ afterPack configuré correctement', 'green')
  } else {
    log('❌ afterPack non configuré ou incorrect', 'red')
    return false
  }
  
  // Vérifier extraResources
  const hasExtraResources = macConfig.extraResources && 
    macConfig.extraResources.some(resource => 
      resource.from && resource.from.includes('platform-tools-latest-darwin')
    )
  
  if (hasExtraResources) {
    log('✅ extraResources configuré correctement', 'green')
  } else {
    log('❌ extraResources non configuré ou incorrect', 'red')
    return false
  }
  
  return true
}

function validateElectronMainIntegration() {
  log('\n⚡ Validation de l\'intégration dans electron/main.ts', 'cyan')
  
  const mainTsPath = path.join(__dirname, '..', 'electron', 'main.ts')
  
  if (!fs.existsSync(mainTsPath)) {
    log('❌ electron/main.ts non trouvé', 'red')
    return false
  }
  
  const mainTsContent = fs.readFileSync(mainTsPath, 'utf8')
  
  const requiredImports = [
    'AdbPermissionChecker',
    'PlatformToolsValidator',
    'AdbErrorHandler'
  ]
  
  const requiredFunctions = [
    'getValidatedAdbPath',
    'validatePlatformToolsOnStartup'
  ]
  
  const requiredHandlers = [
    'adb:check-permissions',
    'adb:fix-permissions',
    'adb:get-diagnostic-report'
  ]
  
  let allChecksPass = true
  
  // Vérifier les imports
  requiredImports.forEach(importName => {
    if (mainTsContent.includes(importName)) {
      log(`✅ Import ${importName}`, 'green')
    } else {
      log(`❌ Import ${importName} manquant`, 'red')
      allChecksPass = false
    }
  })
  
  // Vérifier les fonctions
  requiredFunctions.forEach(functionName => {
    if (mainTsContent.includes(functionName)) {
      log(`✅ Fonction ${functionName}`, 'green')
    } else {
      log(`❌ Fonction ${functionName} manquante`, 'red')
      allChecksPass = false
    }
  })
  
  // Vérifier les handlers IPC
  requiredHandlers.forEach(handler => {
    if (mainTsContent.includes(handler)) {
      log(`✅ Handler ${handler}`, 'green')
    } else {
      log(`❌ Handler ${handler} manquant`, 'red')
      allChecksPass = false
    }
  })
  
  // Vérifier l'intégration au démarrage
  if (mainTsContent.includes('validatePlatformToolsOnStartup')) {
    log('✅ Validation au démarrage intégrée', 'green')
  } else {
    log('❌ Validation au démarrage non intégrée', 'red')
    allChecksPass = false
  }
  
  return allChecksPass
}

function validateAfterPackScript() {
  log('\n🔧 Validation du script afterPack', 'cyan')
  
  const scriptPath = path.join(__dirname, 'fix-macos-permissions.js')
  
  if (!fs.existsSync(scriptPath)) {
    log('❌ Script fix-macos-permissions.js non trouvé', 'red')
    return false
  }
  
  const scriptContent = fs.readFileSync(scriptPath, 'utf8')
  
  const requiredElements = [
    'EXECUTABLE_BINARIES',
    'isExecutable',
    'makeExecutable',
    'fixBinaryPermissions',
    'afterPack'
  ]
  
  let allElementsPresent = true
  
  requiredElements.forEach(element => {
    if (scriptContent.includes(element)) {
      log(`✅ ${element} présent`, 'green')
    } else {
      log(`❌ ${element} manquant`, 'red')
      allElementsPresent = false
    }
  })
  
  // Vérifier que le script peut être exécuté
  try {
    require(scriptPath)
    log('✅ Script peut être chargé', 'green')
  } catch (error) {
    log(`❌ Erreur de chargement du script: ${error.message}`, 'red')
    allElementsPresent = false
  }
  
  return allElementsPresent
}

function runPlatformSpecificTests() {
  log('\n🖥️ Tests spécifiques à la plateforme', 'cyan')
  
  const platform = process.platform
  log(`Plateforme détectée: ${platform}`, 'blue')
  
  if (platform === 'darwin') {
    log('Exécution des tests macOS...', 'yellow')
    
    // Tester avec le dossier platform-tools macOS
    const macPlatformToolsPath = path.join(__dirname, '..', 'platform-tools-latest-darwin (2)', 'platform-tools')
    
    if (fs.existsSync(macPlatformToolsPath)) {
      log('✅ Dossier platform-tools macOS trouvé', 'green')
      
      // Exécuter les tests de permissions
      const directoryValid = testAdbPermissions.testPlatformToolsDirectory(macPlatformToolsPath)
      const binaryResults = testAdbPermissions.testCriticalBinaries(macPlatformToolsPath)
      
      return directoryValid && binaryResults.every(b => b.exists)
    } else {
      log('❌ Dossier platform-tools macOS non trouvé', 'red')
      return false
    }
    
  } else if (platform === 'win32') {
    log('Exécution des tests Windows...', 'yellow')
    
    const winPlatformToolsPath = path.join(__dirname, '..', 'platform-tools-latest-windows (4)', 'platform-tools')
    
    if (fs.existsSync(winPlatformToolsPath)) {
      log('✅ Dossier platform-tools Windows trouvé', 'green')
      
      const directoryValid = testAdbPermissions.testPlatformToolsDirectory(winPlatformToolsPath)
      const binaryResults = testAdbPermissions.testCriticalBinaries(winPlatformToolsPath)
      
      return directoryValid && binaryResults.every(b => b.exists)
    } else {
      log('❌ Dossier platform-tools Windows non trouvé', 'red')
      return false
    }
    
  } else {
    log('⚠️ Plateforme non supportée pour les tests automatiques', 'yellow')
    return true // Ne pas faire échouer pour les plateformes non supportées
  }
}

function generateValidationReport(results) {
  log('\n📋 Génération du rapport de validation', 'cyan')
  
  const report = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    validationResults: results,
    summary: {
      totalChecks: Object.keys(results).length,
      passedChecks: Object.values(results).filter(r => r === true).length,
      failedChecks: Object.values(results).filter(r => r === false).length
    }
  }
  
  report.summary.successRate = (report.summary.passedChecks / report.summary.totalChecks * 100).toFixed(1)
  
  const reportPath = path.join(__dirname, '..', 'adb-solution-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log(`Rapport sauvegardé: ${reportPath}`, 'green')
  
  // Afficher le résumé
  log('\n📊 Résumé de la validation:', 'cyan')
  log(`  Total des vérifications: ${report.summary.totalChecks}`)
  log(`  Réussies: ${report.summary.passedChecks}`, report.summary.passedChecks === report.summary.totalChecks ? 'green' : 'yellow')
  log(`  Échouées: ${report.summary.failedChecks}`, report.summary.failedChecks === 0 ? 'green' : 'red')
  log(`  Taux de réussite: ${report.summary.successRate}%`, report.summary.successRate === '100.0' ? 'green' : 'yellow')
  
  if (report.summary.failedChecks === 0) {
    log('\n🎉 Validation complète réussie! La solution ADB est prête.', 'green')
  } else {
    log('\n⚠️ Certaines vérifications ont échoué. Consultez les détails ci-dessus.', 'red')
  }
  
  return report.summary.failedChecks === 0
}

function main() {
  log('🚀 Validation complète de la solution ADB macOS', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  const results = {}
  
  // 1. Validation de la structure des fichiers
  results.fileStructure = validateFileStructure()
  
  // 2. Validation de la configuration package.json
  results.packageJsonConfig = validatePackageJsonConfiguration()
  
  // 3. Validation de l'intégration dans main.ts
  results.electronMainIntegration = validateElectronMainIntegration()
  
  // 4. Validation du script afterPack
  results.afterPackScript = validateAfterPackScript()
  
  // 5. Tests spécifiques à la plateforme
  results.platformSpecificTests = runPlatformSpecificTests()
  
  // 6. Génération du rapport final
  const validationSuccess = generateValidationReport(results)
  
  // Code de sortie
  process.exit(validationSuccess ? 0 : 1)
}

// Exécuter la validation
if (require.main === module) {
  main()
}