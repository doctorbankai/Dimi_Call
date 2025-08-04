/**
 * Script de test pour valider l'implémentation complète de l'export Google Calendar
 */

// Simulation des données de test
const testContacts = [
  {
    id: '1',
    numeroLigne: 1,
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '+33 6 12 34 56 78',
    email: 'jean.dupont@example.com',
    source: 'LinkedIn',
    statut: 'À rappeler',
    commentaire: 'Contact intéressant',
    dateRappel: '2024-01-15',
    heureRappel: '14:30',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  },
  {
    id: '2',
    numeroLigne: 2,
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '+33 6 98 76 54 32',
    email: 'marie.martin@example.com',
    source: 'École Commerce',
    statut: 'DO',
    commentaire: 'Très intéressée',
    dateRappel: '2024-01-16',
    heureRappel: '', // Événement toute la journée
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  },
  {
    id: '3',
    numeroLigne: 3,
    prenom: 'Pierre',
    nom: 'Durand',
    telephone: '+33 6 11 22 33 44',
    email: 'pierre.durand@example.com',
    source: 'Référence',
    statut: 'RO',
    commentaire: '',
    dateRappel: '', // Pas de rappel
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  }
];

// Fonctions utilitaires (copie simplifiée pour le test)
function formatDateForGoogleCalendar(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    throw new Error('Date invalide pour le formatage Google Calendar');
  }
  
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) {
    throw new Error(`Format de date invalide: ${dateStr}. Attendu: YYYY-MM-DD`);
  }
  
  return `${month}/${day}/${year}`;
}

function formatTimeForGoogleCalendar(timeStr) {
  if (!timeStr || timeStr.trim() === '') {
    return '';
  }
  
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) {
    throw new Error(`Format d'heure invalide: ${timeStr}. Attendu: HH:mm`);
  }
  
  const hour24 = parseInt(hours, 10);
  const mins = parseInt(minutes, 10);
  
  if (isNaN(hour24) || isNaN(mins) || hour24 < 0 || hour24 > 23 || mins < 0 || mins > 59) {
    throw new Error(`Heure invalide: ${timeStr}`);
  }
  
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`;
}

function calculateEndTime(startTime) {
  if (!startTime || startTime.trim() === '') {
    return '';
  }
  
  const [hours, minutes] = startTime.split(':');
  if (!hours || !minutes) {
    throw new Error(`Format d'heure invalide: ${startTime}. Attendu: HH:mm`);
  }
  
  const startMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  const endMinutes = startMinutes + 30; // Ajouter 30 minutes
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  
  const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  return formatTimeForGoogleCalendar(endTimeStr);
}

function buildReminderDescription(contact) {
  const details = [];
  
  if (contact.telephone) details.push(`Téléphone: ${contact.telephone}`);
  if (contact.email) details.push(`Email: ${contact.email}`);
  if (contact.statut) details.push(`Statut: ${contact.statut}`);
  if (contact.source) details.push(`Source: ${contact.source}`);
  if (contact.commentaire) details.push(`Commentaire: ${contact.commentaire}`);
  
  return details.join('\n');
}

// Fonction d'export simplifiée pour le test
function exportGoogleCalendarCSV(contacts) {
  console.log('🧪 Test de l\'export Google Calendar');
  console.log('=====================================');
  
  // Filtrer les contacts ayant des dates de rappel définies
  const contactsWithReminders = contacts.filter(contact => 
    contact.dateRappel && contact.dateRappel.trim() !== ''
  );

  console.log(`📊 Contacts avec rappels: ${contactsWithReminders.length}/${contacts.length}`);

  if (contactsWithReminders.length === 0) {
    throw new Error('Aucun rappel à exporter');
  }

  // Mapping vers le format Google Calendar
  const calendarEvents = contactsWithReminders.map(contact => {
    try {
      const startDate = formatDateForGoogleCalendar(contact.dateRappel);
      const startTime = contact.heureRappel ? formatTimeForGoogleCalendar(contact.heureRappel) : '';
      const endTime = contact.heureRappel ? calculateEndTime(contact.heureRappel) : '';
      const isAllDay = !contact.heureRappel || contact.heureRappel.trim() === '';

      const event = {
        'Subject': `Rappel: ${contact.prenom} ${contact.nom}`,
        'Start Date': startDate,
        'Start Time': startTime,
        'End Date': startDate,
        'End Time': endTime,
        'All Day Event': isAllDay ? 'True' : 'False',
        'Description': buildReminderDescription(contact),
        'Location': '',
        'Private': 'False'
      };

      console.log(`✅ Événement créé pour ${contact.prenom} ${contact.nom}:`);
      console.log(`   - Date: ${event['Start Date']}`);
      console.log(`   - Heure: ${event['Start Time'] || 'Toute la journée'}`);
      console.log(`   - Type: ${event['All Day Event'] === 'True' ? 'Toute la journée' : 'Avec heure'}`);
      
      return event;
    } catch (error) {
      console.error(`❌ Erreur lors du formatage du contact ${contact.prenom} ${contact.nom}:`, error);
      throw new Error(`Erreur de formatage pour le contact ${contact.prenom} ${contact.nom}: ${error.message}`);
    }
  });

  // Simulation de la génération CSV
  console.log('\n📄 Contenu CSV généré:');
  console.log('Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location,Private');
  
  calendarEvents.forEach(event => {
    const csvLine = [
      `"${event.Subject}"`,
      event['Start Date'],
      event['Start Time'],
      event['End Date'],
      event['End Time'],
      event['All Day Event'],
      `"${event.Description.replace(/"/g, '""')}"`, // Échapper les guillemets
      event.Location,
      event.Private
    ].join(',');
    console.log(csvLine);
  });

  // Simulation du nom de fichier
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  const filename = `google-calendar-export-${timestamp}.csv`;
  
  console.log(`\n💾 Nom de fichier: ${filename}`);
  
  return calendarEvents;
}

// Tests de validation
function runTests() {
  console.log('🚀 Démarrage des tests de validation\n');

  try {
    // Test 1: Export avec contacts mixtes
    console.log('Test 1: Export avec contacts mixtes');
    const events = exportGoogleCalendarCSV(testContacts);
    console.log(`✅ Test 1 réussi: ${events.length} événements générés\n`);

    // Test 2: Validation du format des dates
    console.log('Test 2: Validation du format des dates');
    const jeanEvent = events.find(e => e.Subject === 'Rappel: Jean Dupont');
    if (jeanEvent['Start Date'] === '01/15/2024') {
      console.log('✅ Test 2 réussi: Format de date correct\n');
    } else {
      throw new Error(`Format de date incorrect: ${jeanEvent['Start Date']}`);
    }

    // Test 3: Validation du format des heures
    console.log('Test 3: Validation du format des heures');
    if (jeanEvent['Start Time'] === '2:30 PM' && jeanEvent['End Time'] === '3:00 PM') {
      console.log('✅ Test 3 réussi: Format d\'heure correct\n');
    } else {
      throw new Error(`Format d'heure incorrect: ${jeanEvent['Start Time']} - ${jeanEvent['End Time']}`);
    }

    // Test 4: Validation des événements toute la journée
    console.log('Test 4: Validation des événements toute la journée');
    const marieEvent = events.find(e => e.Subject === 'Rappel: Marie Martin');
    if (marieEvent['All Day Event'] === 'True' && marieEvent['Start Time'] === '') {
      console.log('✅ Test 4 réussi: Événement toute la journée correct\n');
    } else {
      throw new Error('Événement toute la journée incorrect');
    }

    // Test 5: Validation des descriptions
    console.log('Test 5: Validation des descriptions');
    if (jeanEvent.Description.includes('Téléphone: +33 6 12 34 56 78') &&
        jeanEvent.Description.includes('Email: jean.dupont@example.com')) {
      console.log('✅ Test 5 réussi: Description complète\n');
    } else {
      throw new Error('Description incomplète');
    }

    // Test 6: Test avec liste vide
    console.log('Test 6: Test avec liste vide');
    try {
      exportGoogleCalendarCSV([]);
      throw new Error('Devrait lever une erreur avec liste vide');
    } catch (error) {
      if (error.message === 'Aucun rappel à exporter') {
        console.log('✅ Test 6 réussi: Gestion correcte de la liste vide\n');
      } else {
        throw error;
      }
    }

    // Test 7: Test avec contacts sans rappels
    console.log('Test 7: Test avec contacts sans rappels');
    const contactsWithoutReminders = testContacts.filter(c => !c.dateRappel);
    try {
      exportGoogleCalendarCSV(contactsWithoutReminders);
      throw new Error('Devrait lever une erreur sans rappels');
    } catch (error) {
      if (error.message === 'Aucun rappel à exporter') {
        console.log('✅ Test 7 réussi: Gestion correcte des contacts sans rappels\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Résumé de l\'implémentation:');
    console.log('- ✅ Fonctions utilitaires de formatage');
    console.log('- ✅ Fonction d\'export Google Calendar CSV');
    console.log('- ✅ Gestion des événements avec et sans heure');
    console.log('- ✅ Formatage correct des dates et heures');
    console.log('- ✅ Construction des descriptions d\'événements');
    console.log('- ✅ Gestion des erreurs et cas limites');
    console.log('- ✅ Génération de noms de fichiers horodatés');
    
    console.log('\n🔗 Prochaines étapes:');
    console.log('1. Tester l\'interface utilisateur dans l\'application');
    console.log('2. Vérifier l\'import du fichier généré dans Google Calendar');
    console.log('3. Valider la cohérence visuelle avec le bouton Contacts');

  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();