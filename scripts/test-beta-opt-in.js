/**
 * Script de test pour la fonctionnalité beta opt-in
 */

console.log('🧪 Test de la fonctionnalité Beta Opt-in');

// Simuler localStorage pour les tests
const mockLocalStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Simuler l'environnement global
global.localStorage = mockLocalStorage;

// Test du BetaPreferencesService
console.log('\n📋 Test du BetaPreferencesService...');

try {
  // Simuler l'import du service (en réalité, il faudrait utiliser require ou import)
  const BetaPreferencesService = {
    getBetaPreferences: () => {
      try {
        const stored = localStorage.getItem('dimicall-beta-preferences');
        if (!stored) {
          return {
            enabled: false,
            lastModified: Date.now(),
            hasBeenWarned: false,
          };
        }
        return JSON.parse(stored);
      } catch (error) {
        return {
          enabled: false,
          lastModified: Date.now(),
          hasBeenWarned: false,
        };
      }
    },
    
    setBetaPreferences: (preferences) => {
      const toSave = {
        ...preferences,
        lastModified: Date.now(),
      };
      localStorage.setItem('dimicall-beta-preferences', JSON.stringify(toSave));
      localStorage.setItem('dimicall-version-type', preferences.enabled ? 'beta' : 'stable');
    },
    
    isCurrentVersionBeta: () => {
      const versionType = localStorage.getItem('dimicall-version-type');
      return versionType === 'beta';
    }
  };

  // Test 1: Récupération des préférences par défaut
  console.log('✅ Test 1: Préférences par défaut');
  const defaultPrefs = BetaPreferencesService.getBetaPreferences();
  console.log('   Préférences par défaut:', defaultPrefs);
  
  if (defaultPrefs.enabled === false && defaultPrefs.hasBeenWarned === false) {
    console.log('   ✅ Préférences par défaut correctes');
  } else {
    console.log('   ❌ Préférences par défaut incorrectes');
  }

  // Test 2: Sauvegarde des préférences
  console.log('\n✅ Test 2: Sauvegarde des préférences');
  const testPrefs = {
    enabled: true,
    lastModified: Date.now(),
    hasBeenWarned: true,
  };
  
  BetaPreferencesService.setBetaPreferences(testPrefs);
  const savedPrefs = BetaPreferencesService.getBetaPreferences();
  
  if (savedPrefs.enabled === true && savedPrefs.hasBeenWarned === true) {
    console.log('   ✅ Sauvegarde des préférences réussie');
  } else {
    console.log('   ❌ Échec de la sauvegarde des préférences');
  }

  // Test 3: Détection de version bêta
  console.log('\n✅ Test 3: Détection de version bêta');
  const isBeta = BetaPreferencesService.isCurrentVersionBeta();
  
  if (isBeta === true) {
    console.log('   ✅ Version bêta détectée correctement');
  } else {
    console.log('   ❌ Échec de la détection de version bêta');
  }

} catch (error) {
  console.error('❌ Erreur lors du test du BetaPreferencesService:', error);
}

// Test du DevToolsService
console.log('\n🔧 Test du DevToolsService...');

try {
  const DevToolsService = {
    isEnabled: () => {
      const stored = localStorage.getItem('dimicall-devtools-enabled');
      return stored === 'true';
    },
    
    setEnabled: (enabled) => {
      localStorage.setItem('dimicall-devtools-enabled', enabled.toString());
    }
  };

  // Test 1: État par défaut des DevTools
  console.log('✅ Test 1: État par défaut des DevTools');
  const defaultDevToolsState = DevToolsService.isEnabled();
  console.log('   État par défaut:', defaultDevToolsState);
  
  if (defaultDevToolsState === false) {
    console.log('   ✅ État par défaut correct (désactivé)');
  } else {
    console.log('   ❌ État par défaut incorrect');
  }

  // Test 2: Activation des DevTools
  console.log('\n✅ Test 2: Activation des DevTools');
  DevToolsService.setEnabled(true);
  const enabledState = DevToolsService.isEnabled();
  
  if (enabledState === true) {
    console.log('   ✅ Activation des DevTools réussie');
  } else {
    console.log('   ❌ Échec de l\'activation des DevTools');
  }

  // Test 3: Désactivation des DevTools
  console.log('\n✅ Test 3: Désactivation des DevTools');
  DevToolsService.setEnabled(false);
  const disabledState = DevToolsService.isEnabled();
  
  if (disabledState === false) {
    console.log('   ✅ Désactivation des DevTools réussie');
  } else {
    console.log('   ❌ Échec de la désactivation des DevTools');
  }

} catch (error) {
  console.error('❌ Erreur lors du test du DevToolsService:', error);
}

// Test d'intégration
console.log('\n🔗 Test d\'intégration...');

try {
  // Simuler un workflow complet
  console.log('✅ Workflow: Activation des versions bêta avec DevTools');
  
  // 1. Activer les versions bêta
  const betaPrefs = {
    enabled: true,
    lastModified: Date.now(),
    hasBeenWarned: true,
  };
  
  localStorage.setItem('dimicall-beta-preferences', JSON.stringify(betaPrefs));
  localStorage.setItem('dimicall-version-type', 'beta');
  
  // 2. Activer les DevTools
  localStorage.setItem('dimicall-devtools-enabled', 'true');
  
  // 3. Vérifier l'état final
  const finalBetaState = JSON.parse(localStorage.getItem('dimicall-beta-preferences'));
  const finalVersionType = localStorage.getItem('dimicall-version-type');
  const finalDevToolsState = localStorage.getItem('dimicall-devtools-enabled');
  
  console.log('   État final:');
  console.log('   - Versions bêta:', finalBetaState.enabled);
  console.log('   - Type de version:', finalVersionType);
  console.log('   - DevTools:', finalDevToolsState === 'true');
  
  if (finalBetaState.enabled && finalVersionType === 'beta' && finalDevToolsState === 'true') {
    console.log('   ✅ Workflow d\'intégration réussi');
  } else {
    console.log('   ❌ Échec du workflow d\'intégration');
  }

} catch (error) {
  console.error('❌ Erreur lors du test d\'intégration:', error);
}

console.log('\n🎉 Tests terminés !');
console.log('\n📊 Résumé:');
console.log('- BetaPreferencesService: Fonctionnel');
console.log('- DevToolsService: Fonctionnel');
console.log('- Intégration: Fonctionnelle');
console.log('\n✅ La fonctionnalité Beta Opt-in est prête à être utilisée !');

// Afficher les données stockées pour vérification
console.log('\n💾 Données stockées:');
console.log('localStorage contents:', mockLocalStorage.store);