# Implementation Plan

- [x] 1. Créer la fonction d'export Google Contacts dans le service de données


  - Ajouter la fonction `exportGoogleContactsCSV` dans `services/dataService.ts`
  - Implémenter le filtrage des contacts par statuts ("À rappeler", "DO", "RO")
  - Créer le mapping vers le format Google Contacts avec les colonnes requises
  - Ajouter la fonction auxiliaire `buildNotesField` pour construire le champ Notes
  - Implémenter la génération CSV avec encodage UTF-8 BOM pour la compatibilité
  - Gérer le téléchargement automatique du fichier avec nom formaté
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_



- [ ] 2. Ajouter le bouton Google Contacts dans l'interface utilisateur
  - Localiser l'ensemble de boutons ribbon dans `src/App.tsx`
  - Ajouter le 4ème bouton avec le style `ribbon-button-modern` cohérent
  - Implémenter l'icône Users et le texte "Google"
  - Ajouter le badge de comptage des contacts filtrés


  - Configurer le tooltip informatif avec détails des statuts
  - _Requirements: 2.1, 2.2_

- [ ] 3. Implémenter la logique de comptage et d'état du bouton
  - Créer un `useMemo` pour calculer le nombre de contacts filtrés en temps réel


  - Implémenter la logique de désactivation du bouton quand aucun contact correspond
  - Ajouter la gestion de l'état du badge de comptage
  - Créer le handler `handleGoogleContactsExport` avec gestion d'erreurs
  - _Requirements: 2.3, 3.1, 3.2, 3.3_



- [ ] 4. Ajouter la gestion des notifications et du feedback utilisateur
  - Intégrer les notifications de succès avec le nombre de contacts exportés
  - Ajouter la gestion des erreurs avec messages informatifs
  - Implémenter les messages d'erreur spécifiques pour chaque cas d'échec
  - Tester l'affichage des notifications dans différents scénarios
  - _Requirements: 3.1, 3.2, 3.3_




- [ ] 5. Créer les tests unitaires pour la fonction d'export
  - Écrire les tests pour le filtrage des contacts par statut
  - Tester la génération du format CSV Google Contacts
  - Vérifier la construction correcte du champ Notes
  - Tester la gestion des champs vides et des caractères spéciaux
  - Valider l'encodage UTF-8 avec BOM
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Tester l'intégration complète et la compatibilité
  - Tester le flux complet d'export depuis l'interface utilisateur
  - Vérifier la compatibilité du fichier CSV avec Google Contacts
  - Tester l'import du fichier généré dans Google Contacts
  - Valider l'affichage correct des caractères spéciaux et accents
  - Tester avec différents jeux de données (contacts vides, nombreux contacts)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.5_