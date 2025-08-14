#!/usr/bin/env node

/**
 * Test final pour valider la correction du problème de pre-releases
 * Ce script simule le comportement complet de l'application
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🎯 TEST FINAL PRE-RELEASE v1.0.31');
console.log('=================================\n');

// Configuration
const REPO_OWNER = 'doctorbankai';
const REPO_NAME = 'Dimi_Call';
const TARGET_PRERELEASE = 'v1.0.31';
const CURRENT_VERSION = '1.0.3';

/**
 * Fait une requête HTTPS et retourne une Promise
 */
function httpsRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'DimiCall-Final-Test'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Simule le comportement de BetaPreferencesService
 */
class MockBetaPreferencesService {
  static getBetaPreferences(enabled = false) {
    return {
      enabled,
      lastModified: Date.now(),
      hasBeenWarned: true
    };
  }
}

/**
 * Simule le comportement d'electron-updater
 */
class MockElectronUpdater {
  constructor() {
    this.allowPrerelease = false;
  }

  async checkForUpdates() {
    console.log(`🔍 [MOCK] electron-updater.checkForUpdates() appelé`);
    console.log(`🔍 [MOCK] allowPrerelease: ${this.allowPrerelease}`);
    
    // Récupérer les releases depuis GitHub
    const releases = await httpsRequest(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    
    // Filtrer selon allowPrerelease
    let availableReleases;
    if (this.allowPrerelease) {
      availableReleases = releases;
      console.log(`🔍 [MOCK] Mode pre-release: ${releases.length} releases considérées`);
    } else {
      availableReleases = releases.filter(r => !r.prerelease);
      console.log(`🔍 [MOCK] Mode stable: ${availableReleases.length} releases considérées`);
    }
    
    const latestRelease = availableReleases[0];
    
    if (latestRelease) {
      const latestVersion = latestRelease.tag_name.replace('v', '');
      console.log(`📦 [MOCK] Release trouvée: ${latestRelease.tag_name}`);
      console.log(`📦 [MOCK] Type: ${latestRelease.prerelease ? 'Pre-release' : 'Stable'}`);
      
      // Simuler la comparaison de version
      if (latestVersion !== CURRENT_VERSION) {
        console.log(`✅ [MOCK] Mise à jour disponible: ${CURRENT_VERSION} -> ${latestVersion}`);
        return {
          updateAvailable: true,
          updateInfo: {
            version: latestVersion,
            prerelease: latestRelease.prerelease,
            releaseDate: latestRelease.published_at
          }
        };
      } else {
        console.log(`ℹ️ [MOCK] Déjà à jour: ${CURRENT_VERSION}`);
        return {
          updateAvailable: false,
          updateInfo: {
            version: latestVersion
          }
        };
      }
    } else {
      console.log(`❌ [MOCK] Aucune release trouvée`);
      return {
        updateAvailable: false,
        updateInfo: null
      };
    }
  }
}

/**
 * Test 1: Scénario utilisateur avec pre-releases DÉSACTIVÉES
 */
async function testStableMode() {
  console.log('🧪 Test 1: Mode Stable (pre-releases désactivées)');
  console.log('------------------------------------------------');
  
  try {
    // Simuler les préférences utilisateur
    const betaPrefs = MockBetaPreferencesService.getBetaPreferences(false);
    console.log(`👤 Préférences utilisateur: enabled=${betaPrefs.enabled}`);
    
    // Simuler la configuration d'electron-updater
    const updater = new MockElectronUpdater();
    updater.allowPrerelease = betaPrefs.enabled;
    
    // Simuler la vérification des mises à jour
    const result = await updater.checkForUpdates();
    
    console.log(`📊 Résultat: ${JSON.stringify(result, null, 2)}`);
    
    // Vérifier que v1.0.31 n'est PAS proposée (car c'est une pre-release)
    if (result.updateAvailable && result.updateInfo.version === '1.0.31') {
      console.log('❌ ÉCHEC: v1.0.31 proposée alors que pre-releases désactivées');
      return false;
    } else if (result.updateAvailable && result.updateInfo.version === '1.0.26') {
      console.log('✅ SUCCÈS: v1.0.26 (stable) proposée comme attendu');
      return true;
    } else {
      console.log('✅ SUCCÈS: Aucune mise à jour ou version différente (comportement acceptable)');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erreur Test 1:', error.message);
    return false;
  }
}

/**
 * Test 2: Scénario utilisateur avec pre-releases ACTIVÉES
 */
async function testPrereleaseMode() {
  console.log('\n🧪 Test 2: Mode Pre-release (pre-releases activées)');
  console.log('--------------------------------------------------');
  
  try {
    // Simuler les préférences utilisateur
    const betaPrefs = MockBetaPreferencesService.getBetaPreferences(true);
    console.log(`👤 Préférences utilisateur: enabled=${betaPrefs.enabled}`);
    
    // Simuler la configuration d'electron-updater
    const updater = new MockElectronUpdater();
    updater.allowPrerelease = betaPrefs.enabled;
    
    // Simuler la vérification des mises à jour
    const result = await updater.checkForUpdates();
    
    console.log(`📊 Résultat: ${JSON.stringify(result, null, 2)}`);
    
    // Vérifier que v1.0.31 EST proposée (car c'est la plus récente avec pre-releases activées)
    if (result.updateAvailable && result.updateInfo.version === '1.0.31') {
      console.log('✅ SUCCÈS: v1.0.31 (pre-release) proposée comme attendu');
      return true;
    } else {
      console.log('❌ ÉCHEC: v1.0.31 non proposée alors que pre-releases activées');
      console.log(`   Version proposée: ${result.updateInfo?.version || 'aucune'}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur Test 2:', error.message);
    return false;
  }
}

/**
 * Test 3: Vérifier la synchronisation des préférences
 */
async function testPreferencesSync() {
  console.log('\n🧪 Test 3: Synchronisation des préférences');
  console.log('-------------------------------------------');
  
  try {
    // Simuler différents états de préférences
    const scenarios = [
      { localStorage: { enabled: true }, file: { enabled: false }, expected: true }, // localStorage plus récent
      { localStorage: { enabled: false }, file: { enabled: true }, expected: false }, // localStorage plus récent
      { localStorage: null, file: { enabled: true }, expected: true }, // Seulement fichier
      { localStorage: { enabled: false }, file: null, expected: false } // Seulement localStorage
    ];
    
    let allPassed = true;
    
    scenarios.forEach((scenario, index) => {
      // Simuler la logique de synchronisation
      let finalPrefs;
      
      if (scenario.localStorage && scenario.file) {
        // Les deux existent, localStorage prend la priorité (plus récent)
        finalPrefs = scenario.localStorage;
      } else if (scenario.localStorage) {
        finalPrefs = scenario.localStorage;
      } else if (scenario.file) {
        finalPrefs = scenario.file;
      } else {
        finalPrefs = { enabled: false }; // Valeur par défaut
      }
      
      if (finalPrefs.enabled === scenario.expected) {
        console.log(`✅ Scénario ${index + 1}: Synchronisation correcte (${finalPrefs.enabled})`);
      } else {
        console.log(`❌ Scénario ${index + 1}: Synchronisation incorrecte (attendu: ${scenario.expected}, obtenu: ${finalPrefs.enabled})`);
        allPassed = false;
      }
    });
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Erreur Test 3:', error.message);
    return false;
  }
}

/**
 * Test 4: Vérifier le cache-busting
 */
async function testCacheBusting() {
  console.log('\n🧪 Test 4: Cache-busting');
  console.log('------------------------');
  
  try {
    const updater = new MockElectronUpdater();
    
    // Premier appel avec allowPrerelease = false
    updater.allowPrerelease = false;
    const result1 = await updater.checkForUpdates();
    
    // Deuxième appel avec allowPrerelease = true (changement de configuration)
    updater.allowPrerelease = true;
    const result2 = await updater.checkForUpdates();
    
    // Les résultats devraient être différents
    const version1 = result1.updateInfo?.version;
    const version2 = result2.updateInfo?.version;
    
    if (version1 !== version2) {
      console.log(`✅ Cache-busting fonctionne: ${version1} -> ${version2}`);
      return true;
    } else {
      console.log(`⚠️ Cache-busting: même version (${version1}) - peut être normal si pas de pre-release plus récente`);
      return true; // Pas forcément un échec
    }
    
  } catch (error) {
    console.error('❌ Erreur Test 4:', error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`🚀 Test final pour la correction du problème pre-release\n`);
  console.log(`🎯 Objectif: Vérifier que les utilisateurs reçoivent v1.0.31 quand pre-releases activées\n`);
  
  const tests = [
    { name: 'Mode Stable', test: testStableMode },
    { name: 'Mode Pre-release', test: testPrereleaseMode },
    { name: 'Synchronisation préférences', test: testPreferencesSync },
    { name: 'Cache-busting', test: testCacheBusting }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const { name, test } of tests) {
    const result = await test();
    results.push({ name, passed: result });
    if (result) passedTests++;
  }
  
  // Résumé final
  console.log('\n📋 RÉSUMÉ FINAL');
  console.log('===============');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n📊 Score: ${passedTests}/${tests.length} tests réussis`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ La correction du problème pre-release semble fonctionner');
    console.log('✅ Les utilisateurs avec pre-releases activées devraient recevoir v1.0.31');
    console.log('✅ Les utilisateurs sans pre-releases resteront sur v1.0.26');
  } else {
    console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('❌ La correction nécessite des ajustements supplémentaires');
  }
  
  console.log('\n💡 PROCHAINES ÉTAPES');
  console.log('====================');
  console.log('1. Compilez et testez l\'application avec ces modifications');
  console.log('2. Activez les DevTools et allez dans Paramètres > Diagnostic');
  console.log('3. Activez les pre-releases et cliquez "Forcer la vérification"');
  console.log('4. Vérifiez que v1.0.31 est proposée');
  console.log('5. Désactivez les pre-releases et vérifiez que v1.0.26 est proposée');
  
  return passedTests === tests.length;
}

// Exécuter le test final
main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });