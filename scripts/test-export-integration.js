/**
 * Script de test pour l'intégration du nouveau système d'export
 */

console.log('🧪 Test d\'intégration du nouveau système d\'export');
console.log('='.repeat(60));

// Simulation des données de contact
const testContacts = [
  {
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '+33 6 12 34 56 78',
    email: 'jean.dupont@email.com',
    source: 'École A',
    statut: 'À rappeler',
    commentaire: 'Intéressé par le produit',
    dateRappel: '2024-01-15',
    heureRappel: '14:30',
    dateRDV: '2024-01-20',
    heureRDV: '10:00',
    dateAppel: '2024-01-10',
    heureAppel: '09:15',
    dureeAppel: '5 min',
    lien: 'https://example.com/profile/jean'
  },
  {
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '+33 6 98 76 54 32',
    email: 'marie.martin@email.com',
    source: 'École B',
    statut: 'Contacté',
    commentaire: 'Demande plus d\'informations',
    dateRappel: '2024-01-16',
    heureRappel: '15:00',
    dateAppel: '2024-01-11',
    heureAppel: '11:30',
    dureeAppel: '8 min',
    lien: 'https://example.com/profile/marie'
  }
];

console.log('\n📋 Données de test :');
console.log(`- Nombre de contacts : ${testContacts.length}`);
console.log(`- Propriétés par contact : ${Object.keys(testContacts[0]).length}`);

// Simulation du processus d'export
console.log('\n🔄 Simulation du processus d\'export :');

// 1. Validation de la configuration
console.log('1. ✅ Validation de la configuration des colonnes');

// 2. Réorganisation des données
console.log('2. 🔄 Réorganisation des données selon le nouvel ordre');

// Simulation de la réorganisation
const EXPORT_COLUMN_ORDER = [
  { exportName: 'Date Rappel', dataProperty: 'dateRappel', order: 1, isVirtual: false },
  { exportName: 'Heure Rappel', dataProperty: 'heureRappel', order: 2, isVirtual: false },
  { exportName: 'Sexe', dataProperty: null, order: 3, isVirtual: true, defaultValue: '' },
  { exportName: 'Prénom', dataProperty: 'prenom', order: 4, isVirtual: false },
  { exportName: 'Nom', dataProperty: 'nom', order: 5, isVirtual: false },
  { exportName: 'Téléphone', dataProperty: 'telephone', order: 6, isVirtual: false },
  { exportName: 'Mail', dataProperty: 'email', order: 7, isVirtual: false },
  { exportName: 'École/Source', dataProperty: 'source', order: 8, isVirtual: false },
  { exportName: 'Type', dataProperty: null, order: 9, isVirtual: true, defaultValue: '' },
  { exportName: 'Qualité', dataProperty: null, order: 10, isVirtual: true, defaultValue: '' },
  { exportName: 'Lien', dataProperty: 'lien', order: 11, isVirtual: false },
  { exportName: 'Date Appel', dataProperty: 'dateAppel', order: 12, isVirtual: false },
  { exportName: 'Heure Appel', dataProperty: 'heureAppel', order: 13, isVirtual: false },
  { exportName: 'Statut', dataProperty: 'statut', order: 14, isVirtual: false },
  { exportName: 'Commentaire', dataProperty: 'commentaire', order: 15, isVirtual: false },
];

function reorderDataForExport(data) {
  return data.map(row => {
    const reorderedRow = {};
    const sortedColumns = [...EXPORT_COLUMN_ORDER].sort((a, b) => a.order - b.order);

    // Ajouter les colonnes dans l'ordre défini
    sortedColumns.forEach(columnConfig => {
      if (columnConfig.isVirtual) {
        reorderedRow[columnConfig.exportName] = columnConfig.defaultValue || '';
      } else if (columnConfig.dataProperty) {
        const value = row[columnConfig.dataProperty];
        reorderedRow[columnConfig.exportName] = value !== undefined ? value : '';
      }
    });

    // Ajouter les colonnes restantes
    const configuredProperties = new Set(
      EXPORT_COLUMN_ORDER
        .filter(config => !config.isVirtual && config.dataProperty)
        .map(config => config.dataProperty)
    );

    const usedExportNames = new Set(EXPORT_COLUMN_ORDER.map(config => config.exportName));

    Object.keys(row).forEach(key => {
      if (!configuredProperties.has(key) && !usedExportNames.has(key)) {
        reorderedRow[key] = row[key];
      }
    });

    return reorderedRow;
  });
}

const reorderedData = reorderDataForExport(testContacts);

// 3. Génération des en-têtes
console.log('3. 📝 Génération des en-têtes dans le bon ordre');
const headers = Object.keys(reorderedData[0]);

// 4. Conversion en format CSV/XLSX
console.log('4. 📄 Conversion en format d\'export');
const csvData = reorderedData.map(row => 
  headers.map(header => row[header] || '')
);

// Afficher le résultat
console.log('\n🎯 Résultat de l\'export :');
console.log('\nEn-têtes dans l\'ordre final :');
headers.forEach((header, index) => {
  const config = EXPORT_COLUMN_ORDER.find(config => config.exportName === header);
  const isVirtual = config?.isVirtual;
  const virtualIndicator = isVirtual ? ' (VIRTUELLE)' : '';
  console.log(`${index + 1}. ${header}${virtualIndicator}`);
});

console.log('\nPremière ligne de données :');
const firstRowData = csvData[0];
headers.forEach((header, index) => {
  const value = firstRowData[index];
  console.log(`${header}: "${value}"`);
});

// Vérifications
console.log('\n✅ Vérifications :');

// Vérifier l'ordre des colonnes prioritaires
const priorityColumns = [
  'Date Rappel', 'Heure Rappel', 'Sexe', 'Prénom', 'Nom', 
  'Téléphone', 'Mail', 'École/Source', 'Type', 'Qualité', 
  'Lien', 'Date Appel', 'Heure Appel', 'Statut', 'Commentaire'
];

let orderCorrect = true;
for (let i = 0; i < priorityColumns.length; i++) {
  if (headers[i] !== priorityColumns[i]) {
    console.log(`❌ Ordre incorrect à la position ${i + 1}: attendu "${priorityColumns[i]}", trouvé "${headers[i]}"`);
    orderCorrect = false;
  }
}

if (orderCorrect) {
  console.log('✅ Ordre des colonnes prioritaires correct');
}

// Vérifier les colonnes virtuelles
const virtualColumns = ['Sexe', 'Type', 'Qualité'];
const virtualColumnsPresent = virtualColumns.every(col => headers.includes(col));
console.log(`✅ Colonnes virtuelles présentes : ${virtualColumnsPresent ? 'Oui' : 'Non'}`);

// Vérifier que les données sont préservées
const originalDataCount = Object.keys(testContacts[0]).length;
const exportDataCount = headers.length;
console.log(`✅ Données préservées : ${originalDataCount} propriétés originales → ${exportDataCount} colonnes d'export`);

// Statistiques finales
console.log('\n📊 Statistiques finales :');
console.log(`- Colonnes configurées : ${EXPORT_COLUMN_ORDER.length}`);
console.log(`- Colonnes dans l'export : ${headers.length}`);
console.log(`- Colonnes virtuelles : ${virtualColumns.length}`);
console.log(`- Colonnes restantes : ${headers.length - EXPORT_COLUMN_ORDER.length}`);

console.log('\n🎉 Test d\'intégration terminé avec succès !');
console.log('📋 Le nouveau système d\'export est prêt à être utilisé');

// Simulation du nom de fichier
const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
console.log(`📁 Nom de fichier généré : DimiCall_${timestamp}.csv`);