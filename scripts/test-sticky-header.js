/**
 * Script de test pour vérifier le fonctionnement du sticky header
 * Ce script peut être exécuté dans la console du navigateur
 */

console.log('🧪 Test du Sticky Header - ContactTable');

// Fonction pour tester le sticky header
function testStickyHeader() {
  console.log('📋 Recherche de la table...');
  
  // Trouver le conteneur de la table
  const tableContainer = document.querySelector('.contact-table-container');
  if (!tableContainer) {
    console.error('❌ Conteneur de table non trouvé');
    return false;
  }
  
  // Trouver le conteneur de scroll
  const scrollContainer = tableContainer.querySelector('[class*="overflow"]');
  if (!scrollContainer) {
    console.error('❌ Conteneur de scroll non trouvé');
    return false;
  }
  
  // Trouver le header
  const tableHeader = scrollContainer.querySelector('thead');
  if (!tableHeader) {
    console.error('❌ Header de table non trouvé');
    return false;
  }
  
  console.log('✅ Éléments trouvés');
  
  // Vérifier les styles du header
  const headerStyles = window.getComputedStyle(tableHeader);
  console.log('📊 Styles du header:');
  console.log('  - position:', headerStyles.position);
  console.log('  - top:', headerStyles.top);
  console.log('  - z-index:', headerStyles.zIndex);
  console.log('  - background:', headerStyles.backgroundColor);
  
  // Vérifier si le header est sticky
  const isSticky = headerStyles.position === 'sticky';
  console.log(isSticky ? '✅ Header est sticky' : '❌ Header n\'est pas sticky');
  
  // Tester le scroll
  console.log('🔄 Test de scroll...');
  const originalScrollTop = scrollContainer.scrollTop;
  
  // Scroll vers le bas
  scrollContainer.scrollTop = 200;
  
  setTimeout(() => {
    const headerRect = tableHeader.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    const isHeaderVisible = headerRect.top >= containerRect.top && 
                           headerRect.top <= containerRect.top + 50; // Marge de 50px
    
    console.log(isHeaderVisible ? '✅ Header reste visible après scroll' : '❌ Header disparaît après scroll');
    
    // Restaurer la position de scroll
    scrollContainer.scrollTop = originalScrollTop;
    
    // Résumé
    console.log('\n📋 Résumé du test:');
    console.log(`  - Header sticky: ${isSticky ? '✅' : '❌'}`);
    console.log(`  - Visible après scroll: ${isHeaderVisible ? '✅' : '❌'}`);
    
    return isSticky && isHeaderVisible;
  }, 100);
}

// Fonction pour tester les cellules du header
function testHeaderCells() {
  console.log('🔍 Test des cellules du header...');
  
  const headerCells = document.querySelectorAll('thead th');
  if (headerCells.length === 0) {
    console.error('❌ Aucune cellule de header trouvée');
    return false;
  }
  
  let allCellsSticky = true;
  headerCells.forEach((cell, index) => {
    const styles = window.getComputedStyle(cell);
    const isSticky = styles.position === 'sticky';
    console.log(`  - Cellule ${index + 1}: ${isSticky ? '✅' : '❌'} sticky`);
    if (!isSticky) allCellsSticky = false;
  });
  
  console.log(`📊 Toutes les cellules sticky: ${allCellsSticky ? '✅' : '❌'}`);
  return allCellsSticky;
}

// Fonction principale de test
function runStickyHeaderTests() {
  console.log('🚀 Démarrage des tests du sticky header...\n');
  
  // Attendre que la page soit chargée
  if (document.readyState !== 'complete') {
    console.log('⏳ Attente du chargement de la page...');
    window.addEventListener('load', runStickyHeaderTests);
    return;
  }
  
  try {
    const headerTest = testStickyHeader();
    const cellsTest = testHeaderCells();
    
    setTimeout(() => {
      console.log('\n🎯 Résultat final:');
      console.log(headerTest && cellsTest ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
      
      if (!headerTest || !cellsTest) {
        console.log('\n🔧 Suggestions de débogage:');
        console.log('1. Vérifiez que les styles CSS sont bien appliqués');
        console.log('2. Inspectez les éléments dans les DevTools');
        console.log('3. Vérifiez la console pour d\'autres erreurs');
      }
    }, 200);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exporter les fonctions pour utilisation manuelle
window.testStickyHeader = testStickyHeader;
window.testHeaderCells = testHeaderCells;
window.runStickyHeaderTests = runStickyHeaderTests;

// Lancer les tests automatiquement si le script est exécuté
if (typeof window !== 'undefined') {
  console.log('💡 Fonctions disponibles:');
  console.log('  - testStickyHeader()');
  console.log('  - testHeaderCells()');
  console.log('  - runStickyHeaderTests()');
  console.log('\n🔄 Lancement automatique dans 2 secondes...');
  
  setTimeout(runStickyHeaderTests, 2000);
}