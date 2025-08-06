/**
 * Script de diagnostic ultra-poussé pour les DevTools
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 DIAGNOSTIC ULTRA-POUSSÉ DES DEVTOOLS');
console.log('=====================================');

// 1. Vérifier la logique dans main.ts
console.log('\n1️⃣ ANALYSE DU CODE MAIN.TS');
const mainContent = fs.readFileSync('electron/main.ts', 'utf8');

// Chercher la logique problématique
const problematicLines = [
  'if (devToolsEnabled || is.dev)',
  'if (devToolsEnabled)',
  'is.dev'
];

problematicLines.forEach(line => {
  if (mainContent.includes(line)) {
    console.log(`✅ Trouvé: ${line}`);
    
    // Extraire le contexte autour de cette ligne
    const lines = mainContent.split('\n');
    const lineIndex = lines.findIndex(l => l.includes(line));
    if (lineIndex !== -1) {
      console.log('   Contexte:');
      for (let i = Math.max(0, lineIndex - 2); i <= Math.min(lines.length - 1, lineIndex + 2); i++) {
        const marker = i === lineIndex ? '>>> ' : '    ';
        console.log(`   ${marker}${i + 1}: ${lines[i].trim()}`);
      }
    }
  } else {
    console.log(`❌ Non trouvé: ${line}`);
  }
});

// 2. Vérifier les logs dans le code
console.log('\n2️⃣ ANALYSE DES LOGS');
const logPatterns = [
  '[DEVTOOLS]',
  'Raccourci détecté',
  'État des préférences',
  'Mode développement',
  'Ouverture des DevTools',
  'DevTools désactivés'
];

logPatterns.forEach(pattern => {
  const count = (mainContent.match(new RegExp(pattern, 'g')) || []).length;
  console.log(`${count > 0 ? '✅' : '❌'} "${pattern}": ${count} occurrence(s)`);
});

// 3. Vérifier la fonction getDevToolsPreferences
console.log('\n3️⃣ ANALYSE DE getDevToolsPreferences');
if (mainContent.includes('getDevToolsPreferences')) {
  console.log('✅ Fonction getDevToolsPreferences trouvée');
  
  // Vérifier si elle a des logs
  const hasLogs = mainContent.includes('[DEVTOOLS-MAIN]');
  console.log(`${hasLogs ? '✅' : '❌'} Logs de débogage: ${hasLogs ? 'présents' : 'absents'}`);
  
  // Vérifier la logique de retour
  const hasCorrectReturn = mainContent.includes('return result || false');
  console.log(`${hasCorrectReturn ? '✅' : '❌'} Logique de retour: ${hasCorrectReturn ? 'correcte' : 'incorrecte'}`);
} else {
  console.log('❌ Fonction getDevToolsPreferences NON TROUVÉE');
}

// 4. Vérifier le DevToolsService
console.log('\n4️⃣ ANALYSE DU DEVTOOLSSERVICE');
const serviceContent = fs.readFileSync('src/services/devToolsService.ts', 'utf8');

const serviceChecks = [
  { name: 'isEnabled method', pattern: 'static isEnabled()' },
  { name: 'localStorage.getItem', pattern: 'localStorage.getItem' },
  { name: 'DEVTOOLS_STORAGE_KEY', pattern: 'dimicall-devtools-enabled' },
  { name: 'async enableDevTools', pattern: 'async enableDevTools()' },
  { name: 'window.electronAPI?.devTools', pattern: 'window.electronAPI?.devTools' }
];

serviceChecks.forEach(check => {
  const found = serviceContent.includes(check.pattern);
  console.log(`${found ? '✅' : '❌'} ${check.name}: ${found ? 'OK' : 'MANQUANT'}`);
});

// 5. Vérifier les handlers IPC
console.log('\n5️⃣ ANALYSE DES HANDLERS IPC');
const ipcHandlers = [
  'devtools:enable',
  'devtools:disable', 
  'devtools:is-enabled'
];

ipcHandlers.forEach(handler => {
  const found = mainContent.includes(`'${handler}'`);
  console.log(`${found ? '✅' : '❌'} Handler ${handler}: ${found ? 'présent' : 'MANQUANT'}`);
});

// 6. Créer un test de localStorage
console.log('\n6️⃣ TEST DE LOCALSTORAGE');
console.log('Créer un fichier de test HTML pour vérifier localStorage...');

const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test DevTools localStorage</title>
</head>
<body>
    <h1>Test DevTools localStorage</h1>
    <button onclick="enableDevTools()">Activer DevTools</button>
    <button onclick="disableDevTools()">Désactiver DevTools</button>
    <button onclick="checkDevTools()">Vérifier État</button>
    <div id="result"></div>
    
    <script>
        const DEVTOOLS_STORAGE_KEY = 'dimicall-devtools-enabled';
        
        function enableDevTools() {
            localStorage.setItem(DEVTOOLS_STORAGE_KEY, 'true');
            console.log('DevTools activés');
            checkDevTools();
        }
        
        function disableDevTools() {
            localStorage.setItem(DEVTOOLS_STORAGE_KEY, 'false');
            console.log('DevTools désactivés');
            checkDevTools();
        }
        
        function checkDevTools() {
            const stored = localStorage.getItem(DEVTOOLS_STORAGE_KEY);
            const enabled = stored === 'true';
            document.getElementById('result').innerHTML = 
                'localStorage value: ' + stored + '<br>' +
                'Enabled: ' + enabled;
            console.log('localStorage value:', stored);
            console.log('Enabled:', enabled);
        }
        
        // Test initial
        checkDevTools();
    </script>
</body>
</html>
`;

fs.writeFileSync('test-devtools-localStorage.html', testHtml);
console.log('✅ Fichier test-devtools-localStorage.html créé');

// 7. Résumé des problèmes potentiels
console.log('\n7️⃣ PROBLÈMES POTENTIELS IDENTIFIÉS');
console.log('==================================');

const problems = [];

// Vérifier la logique OR avec is.dev
if (mainContent.includes('devToolsEnabled || is.dev')) {
  problems.push('🚨 CRITIQUE: Logique "devToolsEnabled || is.dev" permet toujours l\'ouverture en dev');
}

// Vérifier si la correction a été appliquée
if (!mainContent.includes('[DEVTOOLS]')) {
  problems.push('⚠️ LOGS: Logs de débogage manquants pour diagnostiquer');
}

// Vérifier la fonction getDevToolsPreferences
if (!mainContent.includes('getDevToolsPreferences')) {
  problems.push('🚨 CRITIQUE: Fonction getDevToolsPreferences manquante');
}

if (problems.length === 0) {
  console.log('✅ Aucun problème évident détecté dans le code');
} else {
  problems.forEach((problem, index) => {
    console.log(`${index + 1}. ${problem}`);
  });
}

// 8. Instructions de test
console.log('\n8️⃣ INSTRUCTIONS DE TEST');
console.log('======================');
console.log('1. Ouvrez test-devtools-localStorage.html dans un navigateur');
console.log('2. Testez les boutons pour vérifier localStorage');
console.log('3. Lancez npm run dev');
console.log('4. Ouvrez la console Electron (Ctrl+Shift+I dans les DevTools)');
console.log('5. Cherchez les logs [DEVTOOLS] quand vous appuyez sur Ctrl+Shift+I');
console.log('6. Vérifiez que les préférences sont correctement lues');

console.log('\n🎯 DIAGNOSTIC TERMINÉ');
console.log('Consultez les résultats ci-dessus pour identifier les problèmes.');