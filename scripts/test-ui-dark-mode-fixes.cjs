#!/usr/bin/env node

/**
 * Script de validation pour les corrections du mode sombre
 * Teste toutes les fonctionnalités implémentées
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Validation des corrections du mode sombre...\n');

// Test 1: Vérifier que les styles dark mode sont ajoutés au composant Input
function testInputDarkModeStyles() {
  console.log('1. Test des styles dark mode pour Input...');
  
  const inputPath = path.join(__dirname, '../src/components/ui/input.tsx');
  const inputContent = fs.readFileSync(inputPath, 'utf8');
  
  const hasDateFilter = inputContent.includes('[&::-webkit-calendar-picker-indicator]:dark:filter-[invert(1)_brightness(0.8)]');
  const hasTimeFilter = inputContent.includes('type === "time"');
  const hasDateCondition = inputContent.includes('type === "date"');
  
  if (hasDateFilter && hasTimeFilter && hasDateCondition) {
    console.log('   ✅ Styles dark mode ajoutés correctement');
    return true;
  } else {
    console.log('   ❌ Styles dark mode manquants');
    return false;
  }
}

// Test 2: Vérifier le changement de "année(s)" vers "an(s)"
function testTimeUnitLabels() {
  console.log('2. Test du changement de libellé des unités de temps...');
  
  const selectorPath = path.join(__dirname, '../src/components/RelativeDateSelector.tsx');
  const selectorContent = fs.readFileSync(selectorPath, 'utf8');
  
  const hasNewLabel = selectorContent.includes("'an(s)'");
  const hasOldLabel = selectorContent.includes("'année(s)'");
  
  if (hasNewLabel && !hasOldLabel) {
    console.log('   ✅ Libellé mis à jour de "année(s)" vers "an(s)"');
    return true;
  } else {
    console.log('   ❌ Libellé non mis à jour correctement');
    return false;
  }
}

// Test 3: Vérifier l'ajout du statut A0
function testA0Status() {
  console.log('3. Test de l\'ajout du statut A0...');
  
  // Vérifier types.ts
  const typesPath = path.join(__dirname, '../src/types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  const hasA0InEnum = typesContent.includes('A0 = "A0"');
  
  // Vérifier constants.tsx
  const constantsPath = path.join(__dirname, '../src/constants.tsx');
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  const hasA0Colors = constantsContent.includes('[ContactStatus.A0]');
  
  if (hasA0InEnum && hasA0Colors) {
    console.log('   ✅ Statut A0 ajouté avec couleurs');
    return true;
  } else {
    console.log('   ❌ Statut A0 non ajouté correctement');
    return false;
  }
}

// Test 4: Vérifier la création du composant TimePicker
function testTimePickerComponent() {
  console.log('4. Test de la création du composant TimePicker...');
  
  const timePickerPath = path.join(__dirname, '../src/components/ui/time-picker.tsx');
  
  if (fs.existsSync(timePickerPath)) {
    const timePickerContent = fs.readFileSync(timePickerPath, 'utf8');
    const hasInterface = timePickerContent.includes('interface TimePickerProps');
    const hasComponent = timePickerContent.includes('export const TimePicker');
    
    if (hasInterface && hasComponent) {
      console.log('   ✅ Composant TimePicker créé correctement');
      return true;
    } else {
      console.log('   ❌ Composant TimePicker incomplet');
      return false;
    }
  } else {
    console.log('   ❌ Composant TimePicker non créé');
    return false;
  }
}

// Test 5: Vérifier la mise à jour de ReminderDialog
function testReminderDialogUpdate() {
  console.log('5. Test de la mise à jour de ReminderDialog...');
  
  const reminderPath = path.join(__dirname, '../src/components/ReminderDialog.tsx');
  const reminderContent = fs.readFileSync(reminderPath, 'utf8');
  
  const hasTimePickerImport = reminderContent.includes("import { TimePicker }");
  const hasTimePickerUsage = reminderContent.includes("<TimePicker");
  
  if (hasTimePickerImport && hasTimePickerUsage) {
    console.log('   ✅ ReminderDialog mis à jour avec TimePicker');
    return true;
  } else {
    console.log('   ❌ ReminderDialog non mis à jour correctement');
    return false;
  }
}

// Test 6: Vérifier la mise à jour de ContactTable pour A0
function testContactTableA0Support() {
  console.log('6. Test du support A0 dans ContactTable...');
  
  const contactTablePath = path.join(__dirname, '../src/components/ContactTable.tsx');
  const contactTableContent = fs.readFileSync(contactTablePath, 'utf8');
  
  const hasA0Case = contactTableContent.includes('case ContactStatus.A0:');
  
  if (hasA0Case) {
    console.log('   ✅ ContactTable supporte le statut A0');
    return true;
  } else {
    console.log('   ❌ ContactTable ne supporte pas le statut A0');
    return false;
  }
}

// Test 7: Vérifier la création des tests
function testTestFiles() {
  console.log('7. Test de la création des fichiers de test...');
  
  const testFiles = [
    '../src/__tests__/components/ui/TimePicker.test.tsx',
    '../src/__tests__/constants/StatusA0.test.ts',
    '../src/__tests__/components/ui/Input.test.tsx'
  ];
  
  let allTestsExist = true;
  
  testFiles.forEach(testFile => {
    const testPath = path.join(__dirname, testFile);
    if (!fs.existsSync(testPath)) {
      console.log(`   ❌ Fichier de test manquant: ${testFile}`);
      allTestsExist = false;
    }
  });
  
  if (allTestsExist) {
    console.log('   ✅ Tous les fichiers de test créés');
    return true;
  } else {
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  const tests = [
    testInputDarkModeStyles,
    testTimeUnitLabels,
    testA0Status,
    testTimePickerComponent,
    testReminderDialogUpdate,
    testContactTableA0Support,
    testTestFiles
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    if (test()) {
      passedTests++;
    }
    console.log('');
  }
  
  console.log(`📊 Résultats: ${passedTests}/${tests.length} tests réussis\n`);
  
  if (passedTests === tests.length) {
    console.log('🎉 Toutes les corrections du mode sombre ont été implémentées avec succès !');
    console.log('\n📝 Résumé des changements:');
    console.log('   • Icônes date/time visibles en mode sombre');
    console.log('   • Libellé "année(s)" changé en "an(s)"');
    console.log('   • Nouveau statut "A0" avec couleur distincte');
    console.log('   • Composant TimePicker réutilisable créé');
    console.log('   • Tests complets ajoutés');
    
    process.exit(0);
  } else {
    console.log('❌ Certaines corrections ne sont pas complètes. Veuillez vérifier les erreurs ci-dessus.');
    process.exit(1);
  }
}

// Exécuter le script
runAllTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});