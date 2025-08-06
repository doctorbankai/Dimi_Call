
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
    console.log(`🔧 [NUCLEAR] Configuration DevTools: ${devToolsEnabled ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    
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
    console.error('Erreur lors de la restauration de l\'état des DevTools:', error);
  }
});

// 4. Dans les handlers IPC devtools:enable et devtools:disable, ajouter:
// Après avoir mis à jour localStorage, appeler:
// await enableDevToolsBasedOnPreferences();
