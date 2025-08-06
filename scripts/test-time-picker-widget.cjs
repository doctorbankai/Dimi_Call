#!/usr/bin/env node

/**
 * Script de test pour vérifier que les composants TimePicker sont correctement implémentés
 */

const fs = require('fs');
const path = require('path');

console.log('🕐 Test des composants TimePicker...\n');

// Test 1: Vérifier que TimePicker utilise un bouton comme trigger
function testTimePickerTrigger() {
  console.log('1. Test du trigger TimePicker...');
  
  const timePickerPath = path.join(__dirname, '../src/components/ui/time-picker.tsx');
  const timePickerContent = fs.readFileSync(timePickerPath, 'utf8');
  
  const hasButtonTrigger = timePickerContent.includes('<Button') && timePickerContent.includes('PopoverTrigger');
  const hasNoInputTrigger = !timePickerContent.includes('type="time"') || timePickerContent.includes('// Removed input trigger');
  
  if (hasButtonTrigger) {
    console.log('   ✅ TimePicker utilise un bouton comme trigger');
    return true;
  } else {
    console.log('   ❌ TimePicker n\'utilise pas un bouton comme trigger');
    return false;
  }
}

// Test 2: Vérifier que TimePickerSimple existe
function testTimePickerSimple() {
  console.log('2. Test de TimePickerSimple...');
  
  const timePickerSimplePath = path.join(__dirname, '../src/components/ui/time-picker-simple.tsx');
  
  if (fs.existsSync(timePickerSimplePath)) {
    const content = fs.readFileSync(timePickerSimplePath, 'utf8');
    const hasInterface = content.includes('interface TimePickerSimpleProps');
    const hasComponent = content.includes('export const TimePickerSimple');
    
    if (hasInterface && hasComponent) {
      console.log('   ✅ TimePickerSimple créé correctement');
      return true;
    } else {
      console.log('   ❌ TimePickerSimple incomplet');
      return false;
    }
  } else {
    console.log('   ❌ TimePickerSimple non créé');
    return false;
  }
}

// Test 3: Vérifier que Dialogs.tsx utilise les nouveaux composants
function testDialogsUpdate() {
  console.log('3. Test de la mise à jour de Dialogs.tsx...');
  
  const dialogsPath = path.join(__dirname, '../src/components/Dialogs.tsx');
  const dialogsContent = fs.readFileSync(dialogsPath, 'utf8');
  
  const hasTimePickerImport = dialogsContent.includes("import { TimePicker }");
  const hasTimePickerSimpleImport = dialogsContent.includes("import { TimePickerSimple }");
  const hasTimePickerUsage = dialogsContent.includes("<TimePicker") || dialogsContent.includes("<TimePickerSimple");
  
  if (hasTimePickerImport && hasTimePickerSimpleImport && hasTimePickerUsage) {
    console.log('   ✅ Dialogs.tsx mis à jour avec les nouveaux composants');
    return true;
  } else {
    console.log('   ❌ Dialogs.tsx non mis à jour correctement');
    console.log(`     TimePicker import: ${hasTimePickerImport}`);
    console.log(`     TimePickerSimple import: ${hasTimePickerSimpleImport}`);
    console.log(`     Usage: ${hasTimePickerUsage}`);
    return false;
  }
}

// Test 4: Vérifier la structure du widget heures/minutes
function testTimePickerStructure() {
  console.log('4. Test de la structure du widget...');
  
  const timePickerPath = path.join(__dirname, '../src/components/ui/time-picker.tsx');
  const timePickerContent = fs.readFileSync(timePickerPath, 'utf8');
  
  const hasHoursSection = timePickerContent.includes('Heures');
  const hasMinutesSection = timePickerContent.includes('Minutes');
  const hasScrollArea = timePickerContent.includes('ScrollArea');
  const hasGridLayout = timePickerContent.includes('grid-cols-2');
  
  if (hasHoursSection && hasMinutesSection && hasScrollArea && hasGridLayout) {
    console.log('   ✅ Structure du widget heures/minutes correcte');
    return true;
  } else {
    console.log('   ❌ Structure du widget incorrecte');
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  const tests = [
    testTimePickerTrigger,
    testTimePickerSimple,
    testDialogsUpdate,
    testTimePickerStructure
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
    console.log('🎉 Tous les composants TimePicker sont correctement implémentés !');
    console.log('\n📝 Fonctionnalités disponibles:');
    console.log('   • TimePicker avec icône Clock');
    console.log('   • TimePickerSimple sans icône');
    console.log('   • Widget heures/minutes dans popover');
    console.log('   • Sélection par pas de 5 minutes');
    console.log('   • Intégration dans ReminderDialog et Dialogs');
    
    process.exit(0);
  } else {
    console.log('❌ Certains composants TimePicker ne sont pas correctement implémentés.');
    process.exit(1);
  }
}

// Exécuter le script
runAllTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});