/**
 * Utilitaire de test pour vérifier les événements du calendrier
 * À utiliser dans la console du navigateur
 */

import { localDbService } from '@/services/localDbService';
import { calendarEventsService } from '@/services/calendarEventsService';

export async function testCalendarEvents() {
  console.log('=== TEST CALENDAR EVENTS ===');
  
  // 1. Charger tous les événements de la DB
  console.log('\n1. Chargement des événements de la DB...');
  const dbEvents = await localDbService.getAll();
  console.log(`   Nombre total d'événements: ${dbEvents.length}`);
  
  // 2. Afficher les 5 premiers événements
  console.log('\n2. Premiers événements:');
  dbEvents.slice(0, 5).forEach((event, index) => {
    console.log(`   Event ${index + 1}:`, {
      id: event.id,
      prenom: event.prenom,
      nom: event.nom,
      dateRappel: event.dateRappel,
      heureRappel: event.heureRappel,
      dateRDV: event.dateRDV,
      heureRDV: event.heureRDV,
    });
  });
  
  // 3. Compter les événements avec dates
  const withRappel = dbEvents.filter(e => e.dateRappel && e.heureRappel);
  const withRDV = dbEvents.filter(e => e.dateRDV && e.heureRDV);
  console.log(`\n3. Événements avec dates:`);
  console.log(`   Avec Date/Heure Rappel: ${withRappel.length}`);
  console.log(`   Avec Date/Heure RDV: ${withRDV.length}`);
  
  // 4. Afficher quelques exemples
  if (withRappel.length > 0) {
    console.log('\n4. Exemple de Rappel:');
    console.log(withRappel[0]);
  }
  
  if (withRDV.length > 0) {
    console.log('\n5. Exemple de RDV:');
    console.log(withRDV[0]);
  }
  
  // 5. Tester la conversion
  console.log('\n6. Test de conversion...');
  const calendarEvents = await calendarEventsService.getAllEvents();
  console.log(`   Événements convertis: ${calendarEvents.length}`);
  
  if (calendarEvents.length > 0) {
    console.log('\n7. Premier événement converti:');
    console.log(calendarEvents[0]);
  }
  
  console.log('\n=== FIN DU TEST ===');
  
  return {
    totalEvents: dbEvents.length,
    withRappel: withRappel.length,
    withRDV: withRDV.length,
    converted: calendarEvents.length,
  };
}

// Exposer la fonction globalement pour la console
if (typeof window !== 'undefined') {
  (window as any).testCalendarEvents = testCalendarEvents;
}
