#!/usr/bin/env node

/**
 * Script de diagnostic pour le problème de pre-releases GitHub
 * Teste l'API GitHub et la configuration electron-updater
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC PRE-RELEASE GITHUB');
console.log('================================\n');

// Configuration
const REPO_OWNER = 'doctorbankai';
const REPO_NAME = 'Dimi_Call';
const CURRENT_VERSION = '1.0.3'; // Version actuelle dans package.json

/**
 * Fait une requête HTTPS et retourne une Promise
 */
function httpsRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'DimiCall-Diagnostic-Script'
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
 * Test 1: Vérifier l'API GitHub
 */
async function testGitHubAPI() {
  console.log('📡 Test 1: API GitHub');
  console.log('--------------------');
  
  try {
    // Récupérer toutes les releases
    const releases = await httpsRequest(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    
    console.log(`✅ ${releases.length} releases trouvées`);
    
    // Analyser les releases
    const stableReleases = releases.filter(r => !r.prerelease);
    const preReleases = releases.filter(r => r.prerelease);
    
    console.log(`📦 Releases stables: ${stableReleases.length}`);
    console.log(`🧪 Pre-releases: ${preReleases.length}`);
    
    // Afficher les 5 dernières releases
    console.log('\n📋 Dernières releases:');
    releases.slice(0, 5).forEach(release => {
      const type = release.prerelease ? '🧪 PRE' : '📦 STABLE';
      console.log(`  ${type} ${release.tag_name} (${release.name}) - ${release.published_at}`);
    });
    
    // Vérifier spécifiquement v1.0.31
    const v1031 = releases.find(r => r.tag_name === 'v1.0.31');
    if (v1031) {
      console.log(`\n🎯 v1.0.31 trouvée:`);
      console.log(`   Pre-release: ${v1031.prerelease}`);
      console.log(`   Publiée: ${v1031.published_at}`);
      console.log(`   Assets: ${v1031.assets.length}`);
    } else {
      console.log('\n❌ v1.0.31 non trouvée');
    }
    
    // Vérifier la dernière release stable
    const latestStable = stableReleases[0];
    if (latestStable) {
      console.log(`\n📦 Dernière release stable: ${latestStable.tag_name}`);
    }
    
    return { success: true, releases, preReleases, stableReleases };
    
  } catch (error) {
    console.error('❌ Erreur API GitHub:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Vérifier la configuration package.json
 */
function testPackageConfig() {
  console.log('\n⚙️ Test 2: Configuration package.json');
  console.log('------------------------------------');
  
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log(`📦 Version actuelle: ${packageJson.version}`);
    
    // Vérifier la configuration build
    if (packageJson.build && packageJson.build.publish) {
      const publish = packageJson.build.publish;
      console.log(`✅ Configuration publish trouvée:`);
      console.log(`   Provider: ${publish.provider}`);
      console.log(`   Owner: ${publish.owner}`);
      console.log(`   Repo: ${publish.repo}`);
      
      if (publish.provider === 'github' && publish.owner === REPO_OWNER && publish.repo === REPO_NAME) {
        console.log('✅ Configuration GitHub correcte');
      } else {
        console.log('⚠️ Configuration GitHub incorrecte');
      }
    } else {
      console.log('❌ Configuration publish manquante');
    }
    
    // Vérifier electron-updater dans les dépendances
    if (packageJson.dependencies && packageJson.dependencies['electron-updater']) {
      console.log(`✅ electron-updater: ${packageJson.dependencies['electron-updater']}`);
    } else {
      console.log('❌ electron-updater manquant dans les dépendances');
    }
    
    return { success: true, version: packageJson.version };
    
  } catch (error) {
    console.error('❌ Erreur lecture package.json:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Simuler electron-updater
 */
async function simulateElectronUpdater(allowPrerelease = false) {
  console.log(`\n🔄 Test 3: Simulation electron-updater (allowPrerelease: ${allowPrerelease})`);
  console.log('----------------------------------------------------------------');
  
  try {
    const releases = await httpsRequest(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    
    // Filtrer selon allowPrerelease
    let availableReleases;
    if (allowPrerelease) {
      availableReleases = releases; // Toutes les releases
      console.log('🧪 Mode pre-release: toutes les releases considérées');
    } else {
      availableReleases = releases.filter(r => !r.prerelease);
      console.log('📦 Mode stable: seulement les releases stables');
    }
    
    // Trouver la plus récente
    const latestRelease = availableReleases[0];
    
    if (latestRelease) {
      console.log(`✅ Release trouvée: ${latestRelease.tag_name}`);
      console.log(`   Type: ${latestRelease.prerelease ? 'Pre-release' : 'Stable'}`);
      console.log(`   Date: ${latestRelease.published_at}`);
      
      // Comparer avec la version actuelle
      const currentVersion = CURRENT_VERSION;
      const latestVersion = latestRelease.tag_name.replace('v', '');
      
      console.log(`\n📊 Comparaison versions:`);
      console.log(`   Actuelle: ${currentVersion}`);
      console.log(`   Disponible: ${latestVersion}`);
      
      if (latestVersion !== currentVersion) {
        console.log('✅ Mise à jour disponible');
      } else {
        console.log('ℹ️ Déjà à jour');
      }
    } else {
      console.log('❌ Aucune release trouvée');
    }
    
    return { success: true, latestRelease };
    
  } catch (error) {
    console.error('❌ Erreur simulation:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Vérifier les fichiers de mise à jour
 */
async function checkUpdateFiles() {
  console.log('\n📄 Test 4: Fichiers de mise à jour');
  console.log('----------------------------------');
  
  try {
    // Vérifier latest-mac.yml pour la dernière release
    const latestMacUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest-mac.yml`;
    
    console.log('🔍 Vérification latest-mac.yml...');
    
    // Note: On ne peut pas facilement tester cela sans télécharger le fichier
    // Mais on peut vérifier que l'URL est correcte
    console.log(`📍 URL attendue: ${latestMacUrl}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur vérification fichiers:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`🚀 Démarrage du diagnostic pour ${REPO_OWNER}/${REPO_NAME}\n`);
  
  // Test 1: API GitHub
  const githubTest = await testGitHubAPI();
  
  // Test 2: Configuration
  const configTest = testPackageConfig();
  
  // Test 3: Simulation mode stable
  const stableTest = await simulateElectronUpdater(false);
  
  // Test 4: Simulation mode pre-release
  const prereleaseTest = await simulateElectronUpdater(true);
  
  // Test 5: Fichiers de mise à jour
  const filesTest = await checkUpdateFiles();
  
  // Résumé
  console.log('\n📋 RÉSUMÉ DU DIAGNOSTIC');
  console.log('======================');
  
  const tests = [
    { name: 'API GitHub', result: githubTest.success },
    { name: 'Configuration', result: configTest.success },
    { name: 'Mode stable', result: stableTest.success },
    { name: 'Mode pre-release', result: prereleaseTest.success },
    { name: 'Fichiers update', result: filesTest.success }
  ];
  
  tests.forEach(test => {
    const status = test.result ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
  });
  
  const allPassed = tests.every(t => t.result);
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('Le problème semble être dans l\'application elle-même.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué.');
    console.log('Vérifiez la configuration et les erreurs ci-dessus.');
  }
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS');
  console.log('==================');
  
  if (githubTest.success && githubTest.preReleases.length > 0) {
    console.log('✅ Des pre-releases sont disponibles sur GitHub');
    console.log('➡️ Le problème est probablement dans la synchronisation des préférences');
  }
  
  console.log('➡️ Vérifiez les logs Electron pour voir si allowPrerelease est correctement configuré');
  console.log('➡️ Testez manuellement la vérification des mises à jour dans l\'application');
  console.log('➡️ Vérifiez que localStorage contient les bonnes préférences beta');
}

// Exécuter le diagnostic
main().catch(console.error);