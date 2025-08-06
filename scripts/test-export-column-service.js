/**
 * Script de test pour le service de réorganisation des colonnes
 */

console.log('🧪 Test du service de réorganisation des colonnes');
console.log('='.repeat(60));

// Simulation des données de test
const testData = [
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
    lien: 'https://example.com/profile/marie',
    // Colonne supplémentaire non configurée
    notes: 'Notes supplémentaires'
  }
];

// Simulation de la réorganisation (logique JavaScript)
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

function reorderRowForExport(row) {
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
}

// Test de réorganisation
console.log('\n📋 Test de réorganisation des données :');
console.log(`Nombre de lignes à traiter : ${testData.length}`);

const reorderedData = testData.map(row => reorderRowForExport(row));

// Afficher le résultat pour la première ligne
console.log('\n🎯 Résultat pour la première ligne :');
const firstRow = reorderedData[0];
const keys = Object.keys(firstRow);

console.log('Ordre des colonnes dans le résultat :');
keys.forEach((key, index) => {
  const value = firstRow[key];
  const isVirtual = EXPORT_COLUMN_ORDER.find(config => config.exportName === key)?.isVirtual;
  const virtualIndicator = isVirtual ? ' (VIRTUELLE)' : '';
  console.log(`${index + 1}. ${key}${virtualIndicator}: "${value}"`);
});

// Vérifier les colonnes virtuelles
console.log('\n🆕 Vérification des colonnes virtuelles :');
const virtualColumns = ['Sexe', 'Type', 'Qualité'];
virtualColumns.forEach(col => {
  const hasColumn = keys.includes(col);
  const value = firstRow[col];
  const isEmpty = value === '' || value === undefined;
  console.log(`- ${col}: ${hasColumn ? '✅ Présente' : '❌ Manquante'}, Vide: ${isEmpty ? '✅' : '❌'}`);
});

// Vérifier les colonnes restantes
console.log('\n📊 Colonnes restantes (non configurées) :');
const configuredNames = new Set(EXPORT_COLUMN_ORDER.map(config => config.exportName));
const remainingColumns = keys.filter(key => !configuredNames.has(key));
if (remainingColumns.length > 0) {
  remainingColumns.forEach(col => {
    console.log(`- ${col}: "${firstRow[col]}"`);
  });
} else {
  console.log('Aucune colonne restante détectée');
}

// Vérifier la préservation des données
console.log('\n🔍 Vérification de la préservation des données :');
const originalKeys = Object.keys(testData[0]);
let allDataPreserved = true;

originalKeys.forEach(originalKey => {
  // Trouver la colonne correspondante dans le résultat
  const config = EXPORT_COLUMN_ORDER.find(config => config.dataProperty === originalKey);
  const resultKey = config ? config.exportName : originalKey;
  
  const originalValue = testData[0][originalKey];
  const resultValue = firstRow[resultKey];
  
  if (originalValue !== resultValue) {
    console.log(`❌ Donnée modifiée: ${originalKey} (${originalValue}) → ${resultKey} (${resultValue})`);
    allDataPreserved = false;
  }
});

if (allDataPreserved) {
  console.log('✅ Toutes les données ont été préservées');
}

// Statistiques finales
console.log('\n📈 Statistiques finales :');
console.log(`- Colonnes configurées : ${EXPORT_COLUMN_ORDER.length}`);
console.log(`- Colonnes dans le résultat : ${keys.length}`);
console.log(`- Colonnes virtuelles ajoutées : ${virtualColumns.length}`);
console.log(`- Colonnes restantes : ${remainingColumns.length}`);

console.log('\n✅ Test du service de réorganisation terminé !');
console.log('📋 Prochaine étape : Intégration avec le service d\'export existant');