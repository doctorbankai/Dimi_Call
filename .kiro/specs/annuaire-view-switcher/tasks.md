# Implementation Plan

- [x] 1. Créer le composant ViewSwitcher


  - Créer le fichier `src/components/ViewSwitcher.tsx`
  - Implémenter l'interface avec ToggleGroup de shadcn/ui
  - Ajouter les icônes LayoutGrid et Table2 de lucide-react
  - Gérer l'état actif et l'événement de changement
  - _Requirements: 1.1, 1.2, 1.3, 5.3, 5.4_



- [ ] 2. Créer le composant AnnuaireTable
  - Créer le fichier `src/components/AnnuaireTable.tsx`
  - Implémenter la structure de table avec les 15 colonnes définies
  - Ajouter la gestion de la sélection multiple (checkboxes)
  - Implémenter le tri par colonne (clic sur en-tête)
  - Ajouter l'édition inline (double-clic sur cellule)
  - Gérer l'état de chargement avec skeleton loaders


  - Appliquer les styles cohérents avec PaginatedEventTable
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3. Refactoriser AnnuairePage pour supporter les deux vues
  - Ajouter l'état `viewMode` avec persistance localStorage
  - Intégrer le composant ViewSwitcher dans la navbar
  - Implémenter le rendu conditionnel (cards vs table)


  - Assurer que les filtres sont préservés lors du switch
  - Assurer que la sélection est préservée lors du switch
  - Réinitialiser le scroll au top lors du changement de vue
  - _Requirements: 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implémenter les fonctionnalités de la vue table


  - Connecter les actions de sélection multiple (suppression, transfert)
  - Connecter les actions d'export (CSV, Excel)
  - Connecter les actions d'import (CSV, Excel)
  - Connecter le bouton de rafraîchissement
  - Implémenter la mise à jour en base de données lors de l'édition inline
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_



- [ ] 5. Optimiser les performances et l'UX
  - Ajouter la mémoïsation avec useMemo pour les calculs coûteux
  - Utiliser useCallback pour les callbacks stables
  - Ajouter une transition subtile lors du changement de vue
  - Assurer la cohérence des états de chargement entre les vues



  - Gérer l'empty state de manière cohérente
  - _Requirements: 3.1, 5.1_

- [ ] 6. Améliorer l'accessibilité
  - Ajouter les labels ARIA appropriés au ViewSwitcher
  - Assurer la navigation au clavier (Tab, Enter, Escape)
  - Gérer le focus lors du changement de vue
  - Tester avec un lecteur d'écran
  - Vérifier le contraste des couleurs
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 7. Responsive design
  - Tester et ajuster le ViewSwitcher sur mobile
  - Ajouter le scroll horizontal pour la table sur petits écrans
  - Vérifier que toutes les actions restent accessibles sur mobile
  - Tester sur différentes tailles d'écran (mobile, tablette, desktop)
  - _Requirements: 5.1, 5.2_

- [ ]* 8. Tests et validation
  - Écrire les tests unitaires pour ViewSwitcher
  - Écrire les tests unitaires pour AnnuaireTable
  - Écrire les tests d'intégration pour le workflow complet
  - Effectuer les tests manuels de performance avec 1000+ contacts
  - Effectuer les tests manuels d'accessibilité
  - _Requirements: Tous_
