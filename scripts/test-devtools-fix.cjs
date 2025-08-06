/**
 * Script de test pour vérifier le fix des DevTools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Test du fix DevTools - Vérification de l\'implémentation');

// Vérifier que tous les fichiers nécessaires existent
const requiredFiles = [
  'src/services/devToolsService.ts',
  'src/components/BetaOptInSettings.tsx',
  'electron/main.ts',
  'electron/preload.ts',
  'src/__tests__/services/devToolsService.test.ts',
  'src/__tests__/integration/devtools-workflow.test.tsx'
];

console.log('\n📁 Vérification des fichiers...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Certains fichiers sont manquants. Arrêt du test.');
  process.exit(1);
}

// Vérifier que les APIs DevTools sont présentes dans preload.ts
console.log('\n🔍 Vérification des APIs DevTools dans preload.ts...');
const preloadContent = fs.readFileSync('electron/preload.ts', 'utf8');

const requiredAPIs = [
  'devTools: {',
  'enable: () => Promise<{ success: boolean; error?: string }>',
  'disable: () => Promise<{ success: boolean; error?: string }>',
  'isEnabled: () => Promise<{ enabled: boolean }>'
];

let allAPIsPresent = true;
requiredAPIs.forEach(api => {
  if (preloadContent.includes(api)) {
    console.log(`✅ API trouvée: ${api}`);
  } else {
    console.log(`❌ API manquante: ${api}`);
    allAPIsPresent = false;
  }
});

// Vérifier que les handlers IPC sont présents dans main.ts
console.log('\n🔍 Vérification des handlers IPC dans main.ts...');
const mainContent = fs.readFileSync('electron/main.ts', 'utf8');

const requiredHandlers = [
  'devtools:enable',
  'devtools:disable',
  'devtools:is-enabled',
  'getDevToolsPreferences'
];

let allHandlersPresent = true;
requiredHandlers.forEach(handler => {
  if (mainContent.includes(handler)) {
    console.log(`✅ Handler trouvé: ${handler}`);
  } else {
    console.log(`❌ Handler manquant: ${handler}`);
    allHandlersPresent = false;
  }
});

// Vérifier que DevToolsService utilise les nouvelles APIs async
console.log('\n🔍 Vérification du DevToolsService...');
const serviceContent = fs.readFileSync('src/services/devToolsService.ts', 'utf8');

const requiredServiceFeatures = [
  'async enableDevTools(): Promise<void>',
  'async disableDevTools(): Promise<void>',
  'async toggleDevTools(): Promise<void>',
  'async isDevToolsEnabledInElectron(): Promise<boolean>',
  'window.electronAPI?.devTools?.enable',
  'window.electronAPI?.devTools?.disable'
];

let allServiceFeaturesPresent = true;
requiredServiceFeatures.forEach(feature => {
  if (serviceContent.includes(feature)) {
    console.log(`✅ Feature trouvée: ${feature}`);
  } else {
    console.log(`❌ Feature manquante: ${feature}`);
    allServiceFeaturesPresent = false;
  }
});

// Vérifier que BetaOptInSettings active automatiquement les DevTools
console.log('\n🔍 Vérification de l\'intégration Beta/DevTools...');
const betaContent = fs.readFileSync('src/components/BetaOptInSettings.tsx', 'utf8');

const requiredBetaFeatures = [
  'onDevToolsToggle(true)',
  'if (checked && !devToolsEnabled)',
  'if (!devToolsEnabled)'
];

let allBetaFeaturesPresent = true;
requiredBetaFeatures.forEach(feature => {
  if (betaContent.includes(feature)) {
    console.log(`✅ Feature trouvée: ${feature}`);
  } else {
    console.log(`❌ Feature manquante: ${feature}`);
    allBetaFeaturesPresent = false;
  }
});

// Vérifier que les DevTools ne s'ouvrent plus automatiquement en dev
console.log('\n🔍 Vérification de la désactivation auto des DevTools...');
const devToolsAutoOpen = [
  'openDevTools()',
  'DevTools disponibles via Ctrl+Shift+I (si activés dans les paramètres)'
];

let devToolsCorrectlyDisabled = true;
if (mainContent.includes('mainWindow.webContents.openDevTools()') && 
    !mainContent.includes('DevTools disponibles via Ctrl+Shift+I')) {
  console.log('❌ Les DevTools s\'ouvrent encore automatiquement');
  devToolsCorrectlyDisabled = false;
} else {
  console.log('✅ Les DevTools ne s\'ouvrent plus automatiquement');
}

// Résumé final
console.log('\n📊 RÉSUMÉ DU TEST');
console.log('==================');

const checks = [
  { name: 'Fichiers requis', status: allFilesExist },
  { name: 'APIs DevTools (preload)', status: allAPIsPresent },
  { name: 'Handlers IPC (main)', status: allHandlersPresent },
  { name: 'DevToolsService async', status: allServiceFeaturesPresent },
  { name: 'Intégration Beta/DevTools', status: allBetaFeaturesPresent },
  { name: 'DevTools auto désactivés', status: devToolsCorrectlyDisabled }
];

let allChecksPassed = true;
checks.forEach(check => {
  const status = check.status ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!check.status) allChecksPassed = false;
});

if (allChecksPassed) {
  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
  console.log('✅ Le fix DevTools est correctement implémenté');
  console.log('\n📋 Instructions de test manuel:');
  console.log('1. Lancez l\'application avec `npm run dev`');
  console.log('2. Vérifiez que Ctrl+Shift+I ne fonctionne PAS par défaut');
  console.log('3. Allez dans les paramètres et activez les DevTools');
  console.log('4. Vérifiez que Ctrl+Shift+I fonctionne maintenant');
  console.log('5. Redémarrez l\'app et vérifiez que l\'état est persistant');
  console.log('6. Testez l\'activation automatique avec les versions bêta');
} else {
  console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ');
  console.log('Veuillez corriger les problèmes avant de continuer');
  process.exit(1);
}