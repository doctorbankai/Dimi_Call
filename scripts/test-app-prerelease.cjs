#!/usr/bin/env node

/**
 * Script pour tester l'application en mode développement
 * Vérifie que les modifications fonctionnent dans l'app réelle
 */

console.log('🚀 TEST APPLICATION PRE-RELEASE');
console.log('================================\n');

console.log('📋 INSTRUCTIONS DE TEST MANUEL');
console.log('==============================\n');

console.log('1. 🔧 COMPILATION ET DÉMARRAGE');
console.log('   npm run dev');
console.log('   (ou npm run build && npm run start pour tester en mode production)\n');

console.log('2. 🛠️ ACTIVATION DES DEVTOOLS');
console.log('   - Ouvrir l\'application');
console.log('   - Aller dans Paramètres > Mises à jour');
console.log('   - Activer "Activer les outils de développement"');
console.log('   - Redémarrer l\'application si nécessaire\n');

console.log('3. 🔍 ACCÈS AU DIAGNOSTIC');
console.log('   - Aller dans Paramètres');
console.log('   - Cliquer sur "Diagnostic" (nouvelle section)');
console.log('   - Vérifier que les informations s\'affichent correctement\n');

console.log('4. 🧪 TEST MODE STABLE');
console.log('   - S\'assurer que les pre-releases sont DÉSACTIVÉES');
console.log('   - Dans Diagnostic, cliquer "Forcer la vérification"');
console.log('   - Résultat attendu: v1.0.26 proposée (ou aucune mise à jour)\n');

console.log('5. 🚀 TEST MODE PRE-RELEASE');
console.log('   - Aller dans Paramètres > Mises à jour');
console.log('   - ACTIVER "Recevoir les pre-releases GitHub"');
console.log('   - Retourner dans Diagnostic');
console.log('   - Cliquer "Forcer la vérification"');
console.log('   - Résultat attendu: v1.0.31 proposée\n');

console.log('6. 📊 VÉRIFICATION DES LOGS');
console.log('   - Ouvrir les DevTools (F12 ou Ctrl+Shift+I)');
console.log('   - Aller dans l\'onglet Console');
console.log('   - Chercher les logs avec [UPDATE] et [PREFS]');
console.log('   - Vérifier que allowPrerelease change selon les préférences\n');

console.log('7. 🔄 TEST DE PERSISTANCE');
console.log('   - Activer les pre-releases');
console.log('   - Redémarrer l\'application');
console.log('   - Vérifier que les pre-releases sont toujours activées');
console.log('   - Vérifier dans Diagnostic que allowPrerelease = true\n');

console.log('📝 POINTS DE CONTRÔLE');
console.log('=====================\n');

console.log('✅ La section Diagnostic apparaît quand DevTools activés');
console.log('✅ Les informations de diagnostic se chargent correctement');
console.log('✅ "Pre-releases activées" change selon les paramètres');
console.log('✅ "Forcer la vérification" déclenche une nouvelle requête');
console.log('✅ v1.0.31 est proposée quand pre-releases activées');
console.log('✅ v1.0.26 est proposée quand pre-releases désactivées');
console.log('✅ Les préférences persistent après redémarrage');
console.log('✅ Les logs montrent allowPrerelease = true/false selon config\n');

console.log('🐛 DÉPANNAGE');
console.log('============\n');

console.log('Si v1.0.31 n\'est pas proposée:');
console.log('- Vérifier dans les logs que allowPrerelease = true');
console.log('- Vérifier que la synchronisation des préférences fonctionne');
console.log('- Essayer "Forcer la vérification" plusieurs fois');
console.log('- Redémarrer l\'application\n');

console.log('Si les logs ne s\'affichent pas:');
console.log('- Vérifier que les DevTools sont activés');
console.log('- Vérifier que l\'application est en mode développement');
console.log('- Ouvrir la console Electron (pas la console web)\n');

console.log('Si la section Diagnostic n\'apparaît pas:');
console.log('- Vérifier que les DevTools sont activés dans les paramètres');
console.log('- Redémarrer l\'application après activation des DevTools\n');

console.log('🎯 RÉSULTAT ATTENDU');
console.log('===================\n');

console.log('Après ces tests, vous devriez pouvoir confirmer que:');
console.log('1. Les utilisateurs avec pre-releases activées reçoivent v1.0.31');
console.log('2. Les utilisateurs sans pre-releases reçoivent v1.0.26');
console.log('3. Le système de diagnostic fonctionne correctement');
console.log('4. Les logs permettent de déboguer les problèmes\n');

console.log('🚀 Lancez maintenant: npm run dev');
console.log('Et suivez les instructions ci-dessus !\n');