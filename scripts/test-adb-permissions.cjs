#!/usr/bin/env node

/**
 * Script de test manuel pour valider la solution de permissions ADB
 * Usage: node scripts/test-adb-permissions.js [platform-tools-path]
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, 'cyan')
  log(title, 'cyan')
  log('='.repeat(50), 'cyan')
}

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL'
  const color = result ? 'green' : 'red'
  log(`${status} ${testName}`, color)
  if (details) {
    log(`   ${details}`, 'yellow')
  }
}

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK | fs.constants.X_OK)
    return true
  } catch (error) {
    return false
  }
}

function getFilePermissions(filePath) {
  try {
    const stats = fs.statSync(filePath)
    const mode = stats.mode
    const permissions = (mode & parseInt('777', 8)).toString(8)
    return permissions
  } catch (error) {
    return 'unknown'
  }
}

function makeExecutable(filePath) {
  try {
    const stats = fs.statSync(filePath)
    const currentMode = stats.mode
    const newMode = currentMode | 0o755
    
    fs.chmodSync(filePath, newMode)
    return true
  } catch (error) {
    return false
  }
}

function testPlatformToolsDirectory(platformToolsPath) {
  logSection('Test du dossier platform-tools')
  
  // Test 1: Vérifier que le dossier existe
  const dirExists = fs.existsSync(platformToolsPath)
  logTest('Dossier platform-tools existe', dirExists, platformToolsPath)
  
  if (!dirExists) {
    return false
  }

  // Test 2: Vérifier que c'est bien un dossier
  const isDirectory = fs.statSync(platformToolsPath).isDirectory()
  logTest('Est un dossier', isDirectory)
  
  if (!isDirectory) {
    return false
  }

  // Test 3: Lister le contenu
  const files = fs.readdirSync(platformToolsPath)
  logTest('Contenu lisible', files.length > 0, `${files.length} fichiers trouvés`)
  
  log('\nContenu du dossier:', 'blue')
  files.forEach(file => {
    const filePath = path.join(platformToolsPath, file)
    const stats = fs.statSync(filePath)
    const type = stats.isDirectory() ? '📁' : '📄'
    const permissions = stats.isDirectory() ? '' : ` (${getFilePermissions(filePath)})`
    log(`  ${type} ${file}${permissions}`)
  })

  return true
}

function testCriticalBinaries(platformToolsPath) {
  logSection('Test des binaires critiques')
  
  const criticalBinaries = ['adb', 'fastboot']
  const results = []

  criticalBinaries.forEach(binaryName => {
    const binaryPath = path.join(platformToolsPath, binaryName)
    
    log(`\nTest de ${binaryName}:`, 'blue')
    
    // Test existence
    const exists = fs.existsSync(binaryPath)
    logTest(`  ${binaryName} existe`, exists, binaryPath)
    
    if (!exists) {
      results.push({ name: binaryName, exists: false, executable: false })
      return
    }

    // Test permissions
    const permissions = getFilePermissions(binaryPath)
    log(`  Permissions actuelles: ${permissions}`, 'yellow')
    
    // Test exécutable
    const executable = isExecutable(binaryPath)
    logTest(`  ${binaryName} est exécutable`, executable)
    
    results.push({ 
      name: binaryName, 
      exists: true, 
      executable: executable,
      permissions: permissions,
      path: binaryPath
    })
  })

  return results
}

function testPermissionFix(binaryResults) {
  logSection('Test de correction des permissions')
  
  const nonExecutableBinaries = binaryResults.filter(b => b.exists && !b.executable)
  
  if (nonExecutableBinaries.length === 0) {
    log('Aucun binaire ne nécessite de correction', 'green')
    return true
  }

  log(`${nonExecutableBinaries.length} binaires nécessitent une correction`, 'yellow')
  
  let allFixed = true
  
  nonExecutableBinaries.forEach(binary => {
    log(`\nCorrection de ${binary.name}:`, 'blue')
    
    const fixResult = makeExecutable(binary.path)
    logTest(`  Correction de ${binary.name}`, fixResult)
    
    if (fixResult) {
      const newPermissions = getFilePermissions(binary.path)
      const nowExecutable = isExecutable(binary.path)
      
      log(`  Nouvelles permissions: ${newPermissions}`, 'yellow')
      logTest(`  ${binary.name} maintenant exécutable`, nowExecutable)
      
      if (!nowExecutable) {
        allFixed = false
      }
    } else {
      allFixed = false
    }
  })

  return allFixed
}

function testAdbConnectivity(platformToolsPath) {
  logSection('Test de connectivité ADB')
  
  const adbPath = path.join(platformToolsPath, 'adb')
  
  if (!fs.existsSync(adbPath)) {
    logTest('ADB disponible', false, 'Binaire ADB non trouvé')
    return false
  }

  try {
    // Test version ADB
    const versionOutput = execSync(`"${adbPath}" version`, { encoding: 'utf8', timeout: 5000 })
    const version = versionOutput.split('\n')[0]
    logTest('Version ADB', true, version)
    
    // Test liste des appareils
    const devicesOutput = execSync(`"${adbPath}" devices`, { encoding: 'utf8', timeout: 5000 })
    const deviceLines = devicesOutput.split('\n').filter(line => 
      line.trim() && !line.includes('List of devices')
    )
    
    logTest('Commande devices', true, `${deviceLines.length} appareils détectés`)
    
    if (deviceLines.length > 0) {
      log('Appareils connectés:', 'blue')
      deviceLines.forEach(line => {
        log(`  ${line}`)
      })
    }
    
    return true
    
  } catch (error) {
    logTest('Connectivité ADB', false, error.message)
    return false
  }
}

function generateReport(platformToolsPath, testResults) {
  logSection('Rapport de test')
  
  const report = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    platformToolsPath: platformToolsPath,
    tests: testResults
  }
  
  const reportPath = path.join(__dirname, '..', 'adb-permissions-test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log(`Rapport sauvegardé: ${reportPath}`, 'green')
  
  // Résumé
  const totalTests = Object.keys(testResults).length
  const passedTests = Object.values(testResults).filter(result => result === true).length
  const failedTests = totalTests - passedTests
  
  log(`\nRésumé des tests:`, 'cyan')
  log(`  Total: ${totalTests}`)
  log(`  Réussis: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow')
  log(`  Échoués: ${failedTests}`, failedTests === 0 ? 'green' : 'red')
  
  if (failedTests === 0) {
    log('\n🎉 Tous les tests sont passés! ADB devrait fonctionner correctement.', 'green')
  } else {
    log('\n⚠️ Certains tests ont échoué. Vérifiez les détails ci-dessus.', 'red')
  }
}

function main() {
  log('🚀 Test de validation des permissions ADB', 'cyan')
  log(`Plateforme: ${process.platform}`, 'blue')
  
  // Déterminer le chemin des platform-tools
  let platformToolsPath = process.argv[2]
  
  if (!platformToolsPath) {
    // Chemins par défaut selon la plateforme
    if (process.platform === 'darwin') {
      platformToolsPath = path.join(__dirname, '..', 'platform-tools-latest-darwin (2)', 'platform-tools')
    } else if (process.platform === 'win32') {
      platformToolsPath = path.join(__dirname, '..', 'platform-tools-latest-windows (4)', 'platform-tools')
    } else {
      platformToolsPath = path.join(__dirname, '..', 'platform-tools')
    }
  }
  
  log(`Chemin platform-tools: ${platformToolsPath}`, 'blue')
  
  const testResults = {}
  
  // Test 1: Dossier platform-tools
  testResults.directoryValid = testPlatformToolsDirectory(platformToolsPath)
  
  if (!testResults.directoryValid) {
    log('\n❌ Impossible de continuer: dossier platform-tools invalide', 'red')
    return
  }
  
  // Test 2: Binaires critiques
  const binaryResults = testCriticalBinaries(platformToolsPath)
  testResults.criticalBinariesExist = binaryResults.every(b => b.exists)
  testResults.criticalBinariesExecutable = binaryResults.every(b => b.executable)
  
  // Test 3: Correction des permissions (si nécessaire)
  if (!testResults.criticalBinariesExecutable && process.platform !== 'win32') {
    testResults.permissionFixSuccessful = testPermissionFix(binaryResults)
  } else {
    testResults.permissionFixSuccessful = true // Pas nécessaire
  }
  
  // Test 4: Connectivité ADB
  testResults.adbConnectivity = testAdbConnectivity(platformToolsPath)
  
  // Générer le rapport
  generateReport(platformToolsPath, testResults)
}

// Exécuter le script
if (require.main === module) {
  main()
}

module.exports = {
  testPlatformToolsDirectory,
  testCriticalBinaries,
  testPermissionFix,
  testAdbConnectivity
}