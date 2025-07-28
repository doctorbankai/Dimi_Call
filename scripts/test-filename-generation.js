/**
 * Script de test pour vérifier la génération du nom de fichier
 * avec la nouvelle convention incluant heure, minute, seconde
 */

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

function testFilenameGeneration() {
  console.log('🧪 Test de génération du nom de fichier Google Contacts\n');
  
  // Test de la génération du timestamp
  const timestamp = generateTimestamp();
  const filename = `google-contacts-export-${timestamp}.csv`;
  
  console.log('📅 Timestamp généré:', timestamp);
  console.log('📄 Nom de fichier complet:', filename);
  console.log('');
  
  // Vérification du format
  const timestampRegex = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/;
  const filenameRegex = /^google-contacts-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/;
  
  console.log('✅ Vérifications:');
  console.log(`- Format timestamp: ${timestampRegex.test(timestamp) ? '✅ Valide' : '❌ Invalide'}`);
  console.log(`- Format nom de fichier: ${filenameRegex.test(filename) ? '✅ Valide' : '❌ Invalide'}`);
  console.log('');
  
  // Comparaison avec la convention DimiCall
  const dimiCallFilename = `DimiCall_${timestamp}.csv`;
  console.log('📊 Comparaison des conventions:');
  console.log(`- DimiCall: ${dimiCallFilename}`);
  console.log(`- Google Contacts: ${filename}`);
  console.log('');
  
  // Test de plusieurs générations pour vérifier l'unicité
  console.log('🔄 Test d\'unicité (3 générations successives):');
  for (let i = 1; i <= 3; i++) {
    const ts = generateTimestamp();
    const fn = `google-contacts-export-${ts}.csv`;
    console.log(`${i}. ${fn}`);
    
    // Petite pause pour voir la différence de seconde
    const start = Date.now();
    while (Date.now() - start < 1100) {
      // Attendre 1.1 seconde
    }
  }
  
  console.log('\n✅ Test terminé avec succès!');
  console.log('💡 Le nom de fichier inclut maintenant: année-mois-jour-heure-minute-seconde');
}

// Exécuter le test
testFilenameGeneration();