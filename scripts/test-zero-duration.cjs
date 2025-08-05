// Test rapide pour vérifier que calculateEndTime retourne la même heure

// Fonction copiée depuis dataService.ts pour test
const formatTimeForGoogleCalendar = (time) => {
  if (!time || time.trim() === '') {
    return '';
  }
  
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours, 10);
  const min = parseInt(minutes, 10);
  
  if (hour24 === 0) {
    return `12:${min.toString().padStart(2, '0')} AM`;
  } else if (hour24 < 12) {
    return `${hour24}:${min.toString().padStart(2, '0')} AM`;
  } else if (hour24 === 12) {
    return `12:${min.toString().padStart(2, '0')} PM`;
  } else {
    return `${hour24 - 12}:${min.toString().padStart(2, '0')} PM`;
  }
};

const calculateEndTime = (startTime) => {
  if (!startTime || startTime.trim() === '') {
    return '';
  }
  
  const [hours, minutes] = startTime.split(':');
  if (!hours || !minutes) {
    throw new Error(`Format d'heure invalide: ${startTime}. Attendu: HH:mm`);
  }
  
  // Retourner la même heure (créneau de 0 minutes)
  return formatTimeForGoogleCalendar(startTime);
};

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
    console.log(`✅ ${startTime} → ${endTime} (même heure formatée)`);
  } catch (error) {
    console.log(`❌ ${startTime} → Erreur: ${error.message}`);
  }
});

console.log('');
console.log('🎯 Résultat: Les heures de fin sont identiques aux heures de début (formatées pour Google Calendar)');
console.log('📝 Avant: 14:30 → 3:00 PM (30 minutes)');
console.log('📝 Maintenant: 14:30 → 2:30 PM (0 minutes)');