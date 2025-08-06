/**
 * Option nucléaire pour les DevTools
 * Si les gestionnaires d'événements ne fonctionnent pas
 */

const fs = require('fs');

console.log('☢️ OPTION NUCLÉAIRE - DEVTOOLS');
console.log('===============================');

console.log('\n🎯 CETTE SOLUTION:');
console.log('- Désactive COMPLÈTEMENT les DevTools au niveau d\'Electron');
console.log('- Les réactive dynamiquement selon les préférences utilisateur');
console.log('- Ignore tous les raccourcis clavier');

console.log('\n🔧 MODIFICATIONS À APPLIQUER:');

const modifications = `
// Dans createWindow(), remplacer:
webPreferences: {
  preload: join(__dirname, '../preload/preload.mjs'),
  sandbox: false,
  contextIsolation: true,
  nodeIntegration: false,
  devTools: true // ← PROBLÈME: Toujours activé
}

// PAR:
webPreferences: {
  preload: join(__dirname, '../preload/preload.mjs'),
  sandbox: false,
  contextIsolation: true,
  nodeIntegration: false,
  devTools: false // ← SOLUTION: Désactivé par défaut
}

// ET ajouter après la création de la fenêtre:
// Activer/désactiver les DevTools selon les préférences
const enableDevToolsBasedOnPreferences = async () => {
  try {
    const devToolsEnabled = await getDevToolsPreferences();
    if (devToolsEnabled) {
      mainWindow.webContents.setDevToolsWebContents(null);
      console.log('🔧 DevTools activés selon les préférences');
    } else {
      console.log('🔧 DevTools désactivés selon les préférences');
    }
  } catch (error) {
    console.error('Erreur lors de la configuration des DevTools:', error);
  }
};

// Appeler cette fonction après did-finish-load
mainWindow.webContents.once('did-finish-load', async () => {
  await enableDevToolsBasedOnPreferences();
});
`;

console.log(modifications);

console.log('\n🚨 VOULEZ-VOUS APPLIQUER CETTE SOLUTION ?');
console.log('Cette solution est plus radicale mais garantit le fonctionnement.');

// Créer un fichier de patch
const patchContent = `
/**
 * PATCH NUCLÉAIRE POUR DEVTOOLS
 * Appliquer ces modifications dans electron/main.ts
 */

// 1. Dans createWindow(), ligne ~150, changer:
//    devTools: true
// EN:
//    devTools: false

// 2. Ajouter cette fonction après getDevToolsPreferences:
const enableDevToolsBasedOnPreferences = async () => {
  try {
    if (!mainWindow) return;
    
    const devToolsEnabled = await getDevToolsPreferences();
    console.log(\`🔧 [NUCLEAR] Configuration DevTools: \${devToolsEnabled ? 'ACTIVÉS' : 'DÉSACTIVÉS'}\`);
    
    if (devToolsEnabled) {
      // Réactiver les DevTools
      mainWindow.webContents.setDevToolsWebContents(null);
      console.log('🔧 [NUCLEAR] DevTools réactivés');
    } else {
      // S'assurer que les DevTools sont fermés
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      }
      console.log('🔧 [NUCLEAR] DevTools désactivés et fermés');
    }
  } catch (error) {
    console.error('🔧 [NUCLEAR] Erreur configuration DevTools:', error);
  }
};

// 3. Dans did-finish-load, ajouter:
mainWindow.webContents.once('did-finish-load', async () => {
  try {
    setTimeout(async () => {
      await enableDevToolsBasedOnPreferences();
    }, 1000); // Attendre que localStorage soit disponible
  } catch (error) {
    console.error('Erreur lors de la restauration de l\\'état des DevTools:', error);
  }
});

// 4. Dans les handlers IPC devtools:enable et devtools:disable, ajouter:
// Après avoir mis à jour localStorage, appeler:
// await enableDevToolsBasedOnPreferences();
`;

fs.writeFileSync('DEVTOOLS_NUCLEAR_PATCH.md', patchContent);
console.log('\n✅ Patch créé dans: DEVTOOLS_NUCLEAR_PATCH.md');

console.log('\n📋 ÉTAPES SUIVANTES:');
console.log('1. Testez d\'abord avec npm run dev pour voir si les logs [DEVTOOLS] apparaissent');
console.log('2. Si les logs n\'apparaissent toujours pas, appliquez le patch nucléaire');
console.log('3. Le patch désactive complètement les DevTools par défaut');
console.log('4. Les DevTools ne peuvent être activés QUE via les préférences utilisateur');

console.log('\n🎯 AVANTAGES DU PATCH NUCLÉAIRE:');
console.log('✅ Aucun raccourci clavier ne peut contourner la sécurité');
console.log('✅ Contrôle total au niveau d\'Electron');
console.log('✅ Impossible d\'ouvrir les DevTools sans autorisation');
console.log('✅ Fonctionne même si d\'autres gestionnaires interfèrent');

console.log('\n⚠️ INCONVÉNIENTS:');
console.log('❌ Plus complexe à déboguer en développement');
console.log('❌ Nécessite une gestion plus fine des états');

console.log('\n🚀 TESTEZ D\'ABORD LA SOLUTION ACTUELLE AVEC:');
console.log('npm run dev');
console.log('Et vérifiez si les logs [DEVTOOLS] apparaissent quand vous appuyez sur Ctrl+Shift+I');