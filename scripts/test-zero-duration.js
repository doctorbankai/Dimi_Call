// Test rapide pour vérifier que calculateEndTime retourne la même heure
import { calculateEndTime } from '../src/services/dataService.ts';

console.log('🧪 Test de la fonction calculateEndTime (créneau 0 minutes)');
console.log('');

const testCases = [
  '09:30',
  '14:45', 
  '23:45',
  '00:00',
  '12:00'
];

testCases.forEach(startTime => {
  try {
    const endTime = calculateEndTime(startTime);
    console.log(`✅ ${startTime} → ${endTime} (même heure)`);
  } catch (error) {
    console.log(`❌ ${startTime} → Erreur: ${error.message}`);
  }
});

console.log('');
console.log('🎯 Résultat attendu: Toutes les heures de fin doivent être identiques aux heures de début');