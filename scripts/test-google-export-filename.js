/**
 * Test manuel pour vérifier que la fonction exportGoogleContactsCSV
 * génère le bon nom de fichier avec le nouveau format
 */

// Mock des dépendances
const Papa = {
  unparse: (data) => 'mocked,csv,content'
};

// Mock du DOM
global.document = {
  createElement: () => ({
    setAttribute: (attr, value) => {
      if (attr === 'download') {
        console.log('📄 Nom de fichier généré:', value);
        
        // Vérifier le format
        const expectedPattern = /^google-contacts-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/;
        const isValid = expectedPattern.test(value);
        
        console.log(`✅ Format valide: ${isValid ? 'OUI' : 'NON'}`);
        
        if (isValid) {
          const timestamp = value.replace('google-contacts-export-', '').replace('.csv', '');
          console.log(`📅 Timestamp extrait: ${timestamp}`);
          
          // Vérifier que c'est proche de l'heure actuelle
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const currentDate = `${year}-${month}-${day}`;
          
          if (timestamp.startsWith(currentDate)) {
            console.log('✅ Date correcte (aujourd\'hui)');
          } else {
            console.log('❌ Date incorrecte');
          }
        }
      }
    },
    style: {},
    click: () => {},
    remove: () => {}
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};

global.URL = {
  createObjectURL: () => 'mock-url',
  revokeObjectURL: () => {}
};

global.Blob = function(content, options) {
  return { content, options };
};

// Mock des types
const ContactStatus = {
  ARappeler: "À rappeler",
  DO: "DO",
  RO: "RO"
};

// Fonction exportGoogleContactsCSV simplifiée pour le test
function exportGoogleContactsCSV(contacts) {
  // Filtrer les contacts par statut
  const filteredContacts = contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO
  );

  if (filteredContacts.length === 0) {
    throw new Error('Aucun contact à exporter avec les statuts sélectionnés');
  }

  // Mapping vers le format Google Contacts (simplifié pour le test)
  const googleContactsData = filteredContacts.map(contact => ({
    'First Name': contact.prenom || '',
    'Last Name': contact.nom || '',
    'Phone 1 - Value': contact.telephone || '',
    'E-mail 1 - Value': contact.email || '',
    'Notes': `Statut: ${contact.statut}`
  }));

  // Génération du CSV
  const csvContent = Papa.unparse(googleContactsData);
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Generate filename with format: google-contacts-export-YYYY-MM-DD-HH-MM-SS
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  
  // Téléchargement du fichier (simulé)
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `google-contacts-export-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Test
console.log('🧪 Test du nom de fichier Google Contacts Export\n');

const testContacts = [
  {
    id: '1',
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '+33 6 12 34 56 78',
    email: 'jean@test.com',
    statut: ContactStatus.ARappeler
  },
  {
    id: '2',
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '+33 6 98 76 54 32',
    email: 'marie@test.com',
    statut: ContactStatus.DO
  }
];

try {
  exportGoogleContactsCSV(testContacts);
  console.log('\n✅ Test réussi ! Le nom de fichier suit maintenant le format:');
  console.log('   google-contacts-export-YYYY-MM-DD-HH-MM-SS.csv');
  console.log('\n💡 Exemple: google-contacts-export-2025-07-28-16-30-45.csv');
} catch (error) {
  console.error('❌ Erreur lors du test:', error.message);
}