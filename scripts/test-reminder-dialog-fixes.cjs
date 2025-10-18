#!/usr/bin/env node

/**
 * Script de test pour vérifier les corrections du dialogue de rappel
 * 
 * Ce script vérifie que :
 * 1. Le z-index est correctement appliqué aux composants
 * 2. L'input date natif a été supprimé
 * 3. Les attributs ARIA sont présents
 * 4. Les composants utilisent les bonnes props
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des corrections du dialogue de rappel...\n');

let hasErrors = false;

// Fonction utilitaire pour lire un fichier
function readFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
    hasErrors = true;
    return null;
  }
}

// Test 1: Vérifier SingleDayPicker
console.log('📋 Test 1: Vérification du SingleDayPicker');
const singleDayPickerContent = readFile('src/components/ui/single-day-picker.tsx');
if (singleDayPickerContent) {
  // Vérifier la prop zIndex
  if (singleDayPickerContent.includes('zIndex?: number')) {
    console.log('  ✅ Prop zIndex ajoutée');
  } else {
    console.log('  ❌ Prop zIndex manquante');
    hasErrors = true;
  }
  
  // Vérifier l'application du z-index
  if (singleDayPickerContent.includes('style={{ zIndex }}')) {
    console.log('  ✅ Z-index appliqué au PopoverContent');
  } else {
    console.log('  ❌ Z-index non appliqué au PopoverContent');
    hasErrors = true;
  }
  
  // Vérifier la valeur par défaut
  if (singleDayPickerContent.includes('zIndex = 50')) {
    console.log('  ✅ Valeur par défaut du z-index définie');
  } else {
    console.log('  ❌ Valeur par défaut du z-index manquante');
    hasErrors = true;
  }
}

// Test 2: Vérifier TimePicker
console.log('\n📋 Test 2: Vérification du TimePicker');
const timePickerContent = readFile('src/components/ui/time-picker.tsx');
if (timePickerContent) {
  // Vérifier la valeur par défaut du z-index
  if (timePickerContent.includes('zIndex = 20100')) {
    console.log('  ✅ Z-index par défaut mis à jour à 20100');
  } else {
    console.log('  ❌ Z-index par défaut incorrect');
    hasErrors = true;
  }
  
  // Vérifier l'application du z-index
  if (timePickerContent.includes('style={{ zIndex }}')) {
    console.log('  ✅ Z-index appliqué au PopoverContent');
  } else {
    console.log('  ❌ Z-index non appliqué au PopoverContent');
    hasErrors = true;
  }
}

// Test 3: Vérifier RelativeDateSelector
console.log('\n📋 Test 3: Vérification du RelativeDateSelector');
const relativeDateSelectorContent = readFile('src/components/RelativeDateSelector.tsx');
if (relativeDateSelectorContent) {
  // Vérifier la prop zIndex
  if (relativeDateSelectorContent.includes('zIndex?: number')) {
    console.log('  ✅ Prop zIndex ajoutée');
  } else {
    console.log('  ❌ Prop zIndex manquante');
    hasErrors = true;
  }
  
  // Vérifier l'application du z-index au SelectContent
  if (relativeDateSelectorContent.includes('style={{ zIndex }}')) {
    console.log('  ✅ Z-index appliqué au SelectContent');
  } else {
    console.log('  ❌ Z-index non appliqué au SelectContent');
    hasErrors = true;
  }
  
  // Vérifier la valeur par défaut
  if (relativeDateSelectorContent.includes('zIndex = 20100')) {
    console.log('  ✅ Valeur par défaut du z-index définie à 20100');
  } else {
    console.log('  ❌ Valeur par défaut du z-index incorrecte');
    hasErrors = true;
  }
}

// Test 4: Vérifier ReminderDialog
console.log('\n📋 Test 4: Vérification du ReminderDialog');
const reminderDialogContent = readFile('src/components/ReminderDialog.tsx');
if (reminderDialogContent) {
  // Vérifier que l'input date natif a été supprimé
  if (!reminderDialogContent.includes('<Input') || !reminderDialogContent.includes('type="date"')) {
    console.log('  ✅ Input date natif supprimé');
  } else {
    console.log('  ❌ Input date natif toujours présent');
    hasErrors = true;
  }
  
  // Vérifier que handleManualDateChange a été supprimé
  if (!reminderDialogContent.includes('handleManualDateChange')) {
    console.log('  ✅ Fonction handleManualDateChange supprimée');
  } else {
    console.log('  ❌ Fonction handleManualDateChange toujours présente');
    hasErrors = true;
  }
  
  // Vérifier que les z-index sont passés aux composants (3 occurrences attendues)
  const zIndexPattern = /zIndex=\{20100\}/g;
  const zIndexMatches = (reminderDialogContent.match(zIndexPattern) || []).length;
  
  // Debug: afficher un extrait du contenu
  if (zIndexMatches === 0) {
    const hasZIndex = reminderDialogContent.includes('zIndex');
    const has20100 = reminderDialogContent.includes('20100');
    console.log(`  🔍 Debug: hasZIndex=${hasZIndex}, has20100=${has20100}`);
  }
  
  if (zIndexMatches === 3) {
    console.log(`  ✅ Z-index passé aux 3 composants (SingleDayPicker, TimePicker, RelativeDateSelector)`);
  } else {
    console.log(`  ❌ Z-index trouvé ${zIndexMatches} fois au lieu de 3`);
    hasErrors = true;
  }
  
  // Vérifier les attributs ARIA sur SingleDayPicker
  if (reminderDialogContent.includes('aria-label="Date du rappel"')) {
    console.log('  ✅ Attribut aria-label présent sur SingleDayPicker');
  } else {
    console.log('  ❌ Attribut aria-label manquant sur SingleDayPicker');
    hasErrors = true;
  }
  
  if (reminderDialogContent.includes('aria-invalid={!!errors.date}')) {
    console.log('  ✅ Attribut aria-invalid présent sur SingleDayPicker');
  } else {
    console.log('  ❌ Attribut aria-invalid manquant sur SingleDayPicker');
    hasErrors = true;
  }
}

// Résumé
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Des erreurs ont été détectées. Veuillez corriger les problèmes ci-dessus.');
  process.exit(1);
} else {
  console.log('✅ Toutes les vérifications sont passées avec succès !');
  console.log('\n📝 Prochaines étapes :');
  console.log('  1. Tester manuellement le dialogue dans l\'application');
  console.log('  2. Vérifier que les dropdowns s\'ouvrent au-dessus du dialogue');
  console.log('  3. Tester la navigation au clavier');
  console.log('  4. Tester sur mobile (responsive)');
  process.exit(0);
}
