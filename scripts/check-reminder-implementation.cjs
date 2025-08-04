/**
 * Script de vérification de l'implémentation du dialog de rappel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de l\'implémentation du Dialog de Rappel\n');

// Fichiers à vérifier
const files = [
  {
    path: 'src/services/dateCalculationService.ts',
    name: 'DateCalculationService',
    checks: [
      'calculateFutureDate',
      'validateDateRange',
      'getUnitLabel',
      'isValidQuantity'
    ]
  },
  {
    path: 'src/components/RelativeDateSelector.tsx',
    name: 'RelativeDateSelector',
    checks: [
      'RelativeDateSelectorProps',
      'TIME_UNITS',
      'handleQuantityChange',
      'handleUnitChange'
    ]
  },
  {
    path: 'src/components/ReminderDialog.tsx',
    name: 'ReminderDialog',
    checks: [
      'ReminderDialogProps',
      'RelativeDateSelector',
      'handleRelativeDateChange',
      'Sélection manuelle'
    ]
  },
  {
    path: 'src/components/ContactTable.tsx',
    name: 'ContactTable Integration',
    checks: [
      'ReminderDialog',
      'handleOpenReminderDialog',
      'reminderDialog',
      'Bell'
    ]
  }
];

let allGood = true;

files.forEach(file => {
  console.log(`📁 Vérification de ${file.name}...`);
  
  const filePath = path.join(__dirname, '..', file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ Fichier manquant: ${file.path}`);
    allGood = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  file.checks.forEach(check => {
    if (content.includes(check)) {
      console.log(`  ✅ ${check} trouvé`);
    } else {
      console.log(`  ❌ ${check} manquant`);
      allGood = false;
    }
  });
  
  console.log('');
});

// Vérifications spéciales
console.log('🔧 Vérifications spéciales...');

// Vérifier que ContactTable importe ReminderDialog
const contactTablePath = path.join(__dirname, '..', 'src/components/ContactTable.tsx');
if (fs.existsSync(contactTablePath)) {
  const content = fs.readFileSync(contactTablePath, 'utf8');
  
  if (content.includes("import { ReminderDialog }")) {
    console.log('  ✅ Import ReminderDialog dans ContactTable');
  } else {
    console.log('  ❌ Import ReminderDialog manquant dans ContactTable');
    allGood = false;
  }
  
  if (content.includes('title="Programmer un rappel"')) {
    console.log('  ✅ Bouton de rappel avec titre correct');
  } else {
    console.log('  ❌ Bouton de rappel manquant ou titre incorrect');
    allGood = false;
  }
  
  if (content.includes('<Bell className="h-4 w-4"')) {
    console.log('  ✅ Icône Bell présente');
  } else {
    console.log('  ❌ Icône Bell manquante');
    allGood = false;
  }
}

console.log('\n📋 Résumé:');
if (allGood) {
  console.log('✅ Tous les composants semblent correctement implémentés !');
  console.log('\n🔍 Si le dialog ne s\'affiche pas, vérifiez:');
  console.log('1. Que l\'application compile sans erreur');
  console.log('2. Qu\'il n\'y a pas d\'erreurs JavaScript dans la console');
  console.log('3. Que le bouton 🔔 est visible dans la colonne Actions');
  console.log('4. Que le clic sur le bouton déclenche bien l\'ouverture du dialog');
} else {
  console.log('❌ Certains éléments sont manquants. Vérifiez les erreurs ci-dessus.');
}

console.log('\n🚀 Pour tester manuellement:');
console.log('1. Démarrez l\'application');
console.log('2. Ouvrez les DevTools (F12)');
console.log('3. Cherchez le bouton avec l\'icône 🔔 dans le tableau');
console.log('4. Cliquez dessus et vérifiez que le dialog s\'ouvre');
console.log('5. Vérifiez que la section "Sélection rapide" est visible');