/**
 * Script de test pour vérifier que le dialog de rappel fonctionne correctement
 */

console.log('🔍 Test du Dialog de Rappel');

// Test 1: Vérifier que les composants existent
console.log('\n1. Vérification des composants...');

try {
  // Vérifier que le service existe
  const { DateCalculationService } = require('../src/services/dateCalculationService.ts');
  console.log('✅ DateCalculationService trouvé');
  
  // Test du calcul de date
  const futureDate = DateCalculationService.calculateFutureDate(7, 'days');
  console.log(`✅ Calcul de date fonctionne: dans 7 jours = ${futureDate}`);
  
  // Test de validation
  const validation = DateCalculationService.validateDateRange(futureDate);
  console.log(`✅ Validation fonctionne: ${validation.isValid ? 'valide' : 'invalide'}`);
  
} catch (error) {
  console.log('❌ Erreur avec DateCalculationService:', error.message);
}

// Test 2: Vérifier les imports
console.log('\n2. Vérification des imports...');

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/components/RelativeDateSelector.tsx',
  'src/components/ReminderDialog.tsx',
  'src/components/ContactTable.tsx'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} existe`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifications spécifiques
    if (file.includes('ContactTable')) {
      if (content.includes('ReminderDialog')) {
        console.log('  ✅ Import ReminderDialog trouvé');
      } else {
        console.log('  ❌ Import ReminderDialog manquant');
      }
      
      if (content.includes('handleOpenReminderDialog')) {
        console.log('  ✅ Fonction handleOpenReminderDialog trouvée');
      } else {
        console.log('  ❌ Fonction handleOpenReminderDialog manquante');
      }
      
      if (content.includes('Bell')) {
        console.log('  ✅ Icône Bell trouvée');
      } else {
        console.log('  ❌ Icône Bell manquante');
      }
    }
    
    if (file.includes('ReminderDialog')) {
      if (content.includes('RelativeDateSelector')) {
        console.log('  ✅ RelativeDateSelector intégré');
      } else {
        console.log('  ❌ RelativeDateSelector manquant');
      }
    }
    
  } else {
    console.log(`❌ ${file} n'existe pas`);
  }
});

// Test 3: Vérifier la structure HTML attendue
console.log('\n3. Structure HTML attendue...');
console.log('Le dialog devrait contenir:');
console.log('- Titre: "Programmer un Rappel"');
console.log('- Section "Sélection manuelle" avec champs date/heure');
console.log('- Séparateur "ou"');
console.log('- Section "Sélection rapide" avec quantité et unité');
console.log('- Boutons "Annuler" et "Sauvegarder"');

// Test 4: Instructions de débogage
console.log('\n4. Instructions de débogage:');
console.log('Pour vérifier que le dialog s\'ouvre:');
console.log('1. Ouvrez les DevTools (F12)');
console.log('2. Allez dans l\'onglet Console');
console.log('3. Cliquez sur le bouton de rappel (🔔) dans le tableau');
console.log('4. Vérifiez s\'il y a des erreurs JavaScript');
console.log('5. Vérifiez que le dialog apparaît dans le DOM');

console.log('\n5. Vérifications manuelles:');
console.log('- Le bouton 🔔 est-il visible dans la colonne Actions ?');
console.log('- Y a-t-il des erreurs dans la console ?');
console.log('- Le dialog s\'ouvre-t-il quand on clique sur 🔔 ?');
console.log('- Les sélecteurs relatifs sont-ils visibles ?');

console.log('\n✅ Test terminé. Vérifiez les points ci-dessus.');