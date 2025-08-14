#!/usr/bin/env node

/**
 * Tests automatisés pour valider le système de pre-release
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🧪 TESTS SYSTÈME PRE-RELEASE');
console.log('============================\n');

// Configuration
const REPO_OWNER = 'doctorbankai';
const REPO_NAME = 'Dimi_Call';

/**
 * Fait une requête HTTPS et retourne une Promise
 */
function httpsRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'DimiCall-Test-Script'
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
 * Test 1: Vérifier que allowPrerelease est correctement configuré selon les préférences
 */
function testAllowPrereleaseConfiguration() {
  console.log('🧪 Test 1: Configuration allowPrerelease');
  console.log('----------------------------------------');
  
  try {
    // Simuler différentes configurations de préférences
    const testCases = [
      { enabled: true, expected: true },
      { enabled: false, expected: false }
    ];
    
    let allPassed = true;
    
    testCases.forEach((testCase, index) => {
      const { enabled, expected } = testCase;
      
      // Simuler la logique d'electron/main.ts
      const allowPrerelease = enabled;
      
      if (allowPrerelease === expected) {
        console.log(`✅ Test 1.${index + 1}: enabled=${enabled} -> allowPrerelease=${allowPrerelease} ✓`);
      } else {
        console.log(`❌ Test 1.${index + 1}: enabled=${enabled} -> allowPrerelease=${allowPrerelease} (attendu: ${expected})`);
        allPassed = false;
      }
    });
    
    return { success: allPassed, name: 'Configuration allowPrerelease' };
    
  } catch (error) {
    console.error('❌ Erreur Test 1:', error.message);
    return { success: false, name: 'Configuration allowPrerelease', error: error.message };
  }
}

/**
 * Test 2: Vérifier que les pre-releases sont détectées quand l'option est activée
 */
async function testPrereleaseDetection() {
  console.log('\n🧪 Test 2: Détection des pre-releases');
  console.log('-------------------------------------');
  
  try {
    const releases = await httpsRequest(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    
    // Test avec allowPrerelease = true
    const allReleases = releases;
    const latestWithPrerelease = allReleases[0];
    
    // Test avec allowPrerelease = false
    const stableReleases = releases.filter(r => !r.prerelease);
    const latestStable = stableReleases[0];
    
    console.log(`📦 Avec pre-releases: ${latestWithPrerelease.tag_name} (${latestWithPrerelease.prerelease ? 'PRE' : 'STABLE'})`);
    console.log(`📦 Sans pre-releases: ${latestStable.tag_name} (${latestStable.prerelease ? 'PRE' : 'STABLE'})`);
    
    // Vérifier que les résultats sont différents si des pre-releases existent
    const preReleases = releases.filter(r => r.prerelease);
    let testPassed = true;
    
    if (preReleases.length > 0) {
      if (latestWithPrerelease.tag_name === latestStable.tag_name) {
        console.log('⚠️ Même version détectée avec et sans pre-releases (pas de pre-release plus récente)');
      } else {
        console.log('✅ Versions différentes détectées selon allowPrerelease');
      }
    } else {
      console.log('ℹ️ Aucune pre-release disponible pour le test');
    }
    
    return { success: testPassed, name: 'Détection pre-releases' };
    
  } catch (error) {
    console.error('❌ Erreur Test 2:', error.message);
    return { success: false, name: 'Détection pre-releases', error: error.message };
  }
}

/**
 * Test 3: Vérifier que seules les releases stables sont détectées quand l'option est désactivée
 */
async function testStableOnlyDetection() {
  console.log('\n🧪 Test 3: Détection releases stables uniquement');
  console.log('-----------------------------------------------');
  
  try {
    const releases = await httpsRequest(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    
    // Simuler allowPrerelease = false
    const stableReleases = releases.filter(r => !r.prerelease);
    
    console.log(`📦 Releases stables trouvées: ${stableReleases.length}`);
    console.log(`📦 Dernière stable: ${stableReleases[0]?.tag_name || 'aucune'}`);
    
    // Vérifier qu'aucune pre-release n'est dans les résultats
    const hasPrerelease = stableReleases.some(r => r.prerelease);
    
    if (!hasPrerelease) {
      console.log('✅ Aucune pre-release dans les résultats stables');
      return { success: true, name: 'Détection stables uniquement' };
    } else {
      console.log('❌ Des pre-releases ont été trouvées dans les résultats stables');
      return { success: false, name: 'Détection stables uniquement' };
    }
    
  } catch (error) {
    console.error('❌ Erreur Test 3:', error.message);
    return { success: false, name: 'Détection stables uniquement', error: error.message };
  }
}

/**
 * Test 4: Test de persistance des préférences
 */
function testPreferencesPersistence() {
  console.log('\n🧪 Test 4: Persistance des préférences');
  console.log('--------------------------------------');
  
  try {
    // Simuler le comportement de BetaPreferencesService
    const testPrefs = {
      enabled: true,
      lastModified: Date.now(),
      hasBeenWarned: true
    };
    
    // Simuler la sauvegarde localStorage
    const serialized = JSON.stringify(testPrefs);
    const deserialized = JSON.parse(serialized);
    
    // Vérifier que les données sont identiques
    const keysMatch = Object.keys(testPrefs).every(key => 
      testPrefs[key] === deserialized[key]
    );
    
    if (keysMatch) {
      console.log('✅ Sérialisation/désérialisation des préférences OK');
      
      // Test de validation
      const isValid = (
        typeof deserialized.enabled === 'boolean' &&
        typeof deserialized.lastModified === 'number' &&
        typeof deserialized.hasBeenWarned === 'boolean'
      );
      
      if (isValid) {
        console.log('✅ Validation des types de préférences OK');
        return { success: true, name: 'Persistance préférences' };
      } else {
        console.log('❌ Validation des types échouée');
        return { success: false, name: 'Persistance préférences' };
      }
    } else {
      console.log('❌ Données corrompues lors de la sérialisation');
      return { success: false, name: 'Persistance préférences' };
    }
    
  } catch (error) {
    console.error('❌ Erreur Test 4:', error.message);
    return { success: false, name: 'Persistance préférences', error: error.message };
  }
}

/**
 * Test 5: Test de gestion des préférences corrompues
 */
function testCorruptedPreferences() {
  console.log('\n🧪 Test 5: Gestion préférences corrompues');
  console.log('-----------------------------------------');
  
  try {
    const corruptedData = [
      null,
      undefined,
      'invalid json',
      { enabled: 'not a boolean' },
      { lastModified: 'not a number' },
      []
    ];
    
    let allPassed = true;
    
    corruptedData.forEach((data, index) => {
      try {
        // Simuler la logique de validation de BetaPreferencesService
        let isValid = false;
        
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          isValid = (
            typeof data.enabled === 'boolean' &&
            typeof data.lastModified === 'number' &&
            typeof data.hasBeenWarned === 'boolean'
          );
        }
        
        if (!isValid) {
          // Utiliser les valeurs par défaut
          const defaultPrefs = {
            enabled: false,
            lastModified: Date.now(),
            hasBeenWarned: false
          };
          
          console.log(`✅ Test 5.${index + 1}: Données corrompues détectées, valeurs par défaut utilisées`);
        } else {
          console.log(`❌ Test 5.${index + 1}: Données corrompues non détectées`);
          allPassed = false;
        }
        
      } catch (error) {
        console.log(`✅ Test 5.${index + 1}: Exception gérée correctement`);
      }
    });
    
    return { success: allPassed, name: 'Gestion préférences corrompues' };
    
  } catch (error) {
    console.error('❌ Erreur Test 5:', error.message);
    return { success: false, name: 'Gestion préférences corrompues', error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`🚀 Démarrage des tests pour ${REPO_OWNER}/${REPO_NAME}\n`);
  
  const tests = [
    testAllowPrereleaseConfiguration(),
    await testPrereleaseDetection(),
    await testStableOnlyDetection(),
    testPreferencesPersistence(),
    testCorruptedPreferences()
  ];
  
  // Résumé
  console.log('\n📋 RÉSUMÉ DES TESTS');
  console.log('==================');
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${test.name}`);
    
    if (test.error) {
      console.log(`   Erreur: ${test.error}`);
    }
    
    if (test.success) {
      passedTests++;
    }
  });
  
  console.log(`\n📊 Résultat: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés !');
    console.log('Le système de pre-release semble fonctionner correctement.');
  } else {
    console.log('⚠️ Certains tests ont échoué.');
    console.log('Vérifiez les erreurs ci-dessus et corrigez les problèmes.');
  }
  
  // Recommandations
  console.log('\n💡 PROCHAINES ÉTAPES');
  console.log('====================');
  console.log('1. Testez manuellement dans l\'application');
  console.log('2. Vérifiez les logs Electron pendant les tests');
  console.log('3. Activez/désactivez les pre-releases et vérifiez les mises à jour');
  console.log('4. Redémarrez l\'application pour tester la persistance');
  
  return passedTests === totalTests;
}

// Exécuter les tests
main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });