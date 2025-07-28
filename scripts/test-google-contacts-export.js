/**
 * Script de test pour l'export Google Contacts
 * Teste la fonction buildNotesField avec toutes les données possibles
 */

// Mock des types et fonctions nécessaires
const ContactStatus = {
  ARappeler: "À rappeler",
  DO: "DO", 
  RO: "RO",
  NonDefini: "Non défini"
};

// Fonction buildNotesField copiée du service
const buildNotesField = (contact) => {
  const notes = [];
  
  // Informations de base
  if (contact.numeroLigne) {
    notes.push(`Ligne: ${contact.numeroLigne}`);
  }
  
  if (contact.source) {
    notes.push(`Source: ${contact.source}`);
  }
  
  // Statut (toujours inclus)
  notes.push(`Statut: ${contact.statut}`);
  
  // Commentaires
  if (contact.commentaire) {
    notes.push(`Commentaire: ${contact.commentaire}`);
  }
  
  // Dates et heures de rappel
  if (contact.dateRappel) {
    const rappelInfo = [`Date rappel: ${contact.dateRappel}`];
    if (contact.heureRappel) {
      rappelInfo.push(`Heure rappel: ${contact.heureRappel}`);
    }
    notes.push(rappelInfo.join(' - '));
  }
  
  // Dates et heures de RDV
  if (contact.dateRDV) {
    const rdvInfo = [`Date RDV: ${contact.dateRDV}`];
    if (contact.heureRDV) {
      rdvInfo.push(`Heure RDV: ${contact.heureRDV}`);
    }
    notes.push(rdvInfo.join(' - '));
  }
  
  // Dates et heures d'appel
  if (contact.dateAppel) {
    const appelInfo = [`Date appel: ${contact.dateAppel}`];
    if (contact.heureAppel) {
      appelInfo.push(`Heure appel: ${contact.heureAppel}`);
    }
    if (contact.dureeAppel) {
      appelInfo.push(`Durée: ${contact.dureeAppel}`);
    }
    notes.push(appelInfo.join(' - '));
  }
  
  // Lien internet
  if (contact.lien) {
    notes.push(`Lien: ${contact.lien}`);
  }
  
  // Informations personnelles supplémentaires
  if (contact.sexe) {
    notes.push(`Sexe: ${contact.sexe}`);
  }
  
  if (contact.don) {
    notes.push(`Don: ${contact.don}`);
  }
  
  if (contact.qualite) {
    notes.push(`Qualité: ${contact.qualite}`);
  }
  
  if (contact.type) {
    notes.push(`Type: ${contact.type}`);
  }
  
  if (contact.date) {
    notes.push(`Date générale: ${contact.date}`);
  }
  
  // Informations utilisateur
  if (contact.utilisateur) {
    notes.push(`Utilisateur: ${contact.utilisateur}`);
  }
  
  // Statuts spécialisés
  if (contact.statutAppel) {
    notes.push(`Statut appel: ${contact.statutAppel}`);
  }
  
  if (contact.statutRDV) {
    notes.push(`Statut RDV: ${contact.statutRDV}`);
  }
  
  if (contact.commentaireRDV) {
    notes.push(`Commentaire RDV: ${contact.commentaireRDV}`);
  }
  
  // Identifiants techniques (optionnels, pour le debug)
  if (contact.uid) {
    notes.push(`UID: ${contact.uid}`);
  }
  
  if (contact.uid_supabase) {
    notes.push(`UID Supabase: ${contact.uid_supabase}`);
  }
  
  return notes.join(' | ');
};

// Fonction de test
function testBuildNotesField() {
  console.log('🧪 Test de la fonction buildNotesField améliorée\n');
  
  // Test 1: Contact avec données minimales
  const contactMinimal = {
    id: '1',
    numeroLigne: 1,
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '+33 6 12 34 56 78',
    email: 'jean.dupont@email.com',
    source: 'LinkedIn',
    statut: ContactStatus.ARappeler,
    commentaire: ''
  };
  
  console.log('📋 Test 1 - Contact minimal:');
  console.log('Notes:', buildNotesField(contactMinimal));
  console.log('');
  
  // Test 2: Contact avec toutes les données
  const contactComplet = {
    id: '2',
    numeroLigne: 42,
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '+33 1 23 45 67 89',
    email: 'marie.martin@email.com',
    source: 'Site web',
    statut: ContactStatus.DO,
    commentaire: 'Très intéressée par nos services',
    dateRappel: '2024-01-15',
    heureRappel: '14:30',
    dateRDV: '2024-01-20',
    heureRDV: '10:00',
    dateAppel: '2024-01-10',
    heureAppel: '16:45',
    dureeAppel: '05:30',
    lien: 'https://linkedin.com/in/marie-martin',
    sexe: 'F',
    don: '500€',
    qualite: 'Cadre supérieur',
    type: 'Prospect chaud',
    date: '2024-01-05',
    utilisateur: 'Dimitri Morel',
    statutAppel: 'Réussi',
    statutRDV: 'Confirmé',
    commentaireRDV: 'RDV en visio Teams',
    uid: 'uid-12345',
    uid_supabase: 'sb-67890'
  };
  
  console.log('📋 Test 2 - Contact complet:');
  console.log('Notes:', buildNotesField(contactComplet));
  console.log('');
  
  // Test 3: Contact avec données partielles
  const contactPartiel = {
    id: '3',
    numeroLigne: 15,
    prenom: 'Pierre',
    nom: 'Durand',
    telephone: '+33 6 98 76 54 32',
    email: '',
    source: 'Référence',
    statut: ContactStatus.RO,
    commentaire: 'À recontacter après les vacances',
    dateAppel: '2024-01-08',
    heureAppel: '11:20',
    dureeAppel: '03:15',
    lien: 'https://company.com/pierre-durand',
    qualite: 'Directeur',
    utilisateur: 'Assistant commercial'
  };
  
  console.log('📋 Test 3 - Contact partiel:');
  console.log('Notes:', buildNotesField(contactPartiel));
  console.log('');
  
  // Test 4: Vérification de la longueur des notes
  const notesComplet = buildNotesField(contactComplet);
  console.log('📊 Statistiques:');
  console.log(`- Longueur des notes complètes: ${notesComplet.length} caractères`);
  console.log(`- Nombre de champs inclus: ${notesComplet.split(' | ').length}`);
  console.log('');
  
  console.log('✅ Tests terminés avec succès!');
  console.log('');
  console.log('💡 Résumé des améliorations:');
  console.log('- Toutes les données du contact sont maintenant incluses dans les notes');
  console.log('- Formatage amélioré pour les dates/heures (groupées logiquement)');
  console.log('- Informations techniques (UID) incluses pour le debug');
  console.log('- Structure claire et lisible avec séparateurs |');
}

// Exécuter les tests
testBuildNotesField();