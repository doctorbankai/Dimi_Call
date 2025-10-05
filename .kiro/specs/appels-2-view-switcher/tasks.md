# Implementation Plan

- [x] 1. Créer la fonction de conversion des données


  - Créer une fonction utilitaire `convertToDirectoryContact` dans AppelsCardsView.tsx
  - Mapper tous les champs de Contact vers DirectoryContact
  - Gérer les champs optionnels (reminder, rdv, lastCall)
  - Utiliser `useMemo` pour optimiser la conversion
  - _Requirements: 2.1, 3.3, 3.4_


- [ ] 2. Ajouter l'état de vue et la persistance
  - Ajouter l'import de ViewMode depuis ViewSwitcher
  - Créer l'état `viewMode` avec initialisation depuis localStorage (clé: 'appels-2-view-mode')
  - Implémenter useEffect pour sauvegarder la préférence dans localStorage
  - Gérer les erreurs de localStorage avec try/catch

  - _Requirements: 1.4, 1.5, 4.5_

- [ ] 3. Intégrer le ViewSwitcher dans la navbar
  - Importer le composant ViewSwitcher depuis @/components/ViewSwitcher
  - Ajouter le ViewSwitcher dans le JSX de la navbar après les Tabs
  - Passer les props currentView et onViewChange

  - Vérifier le positionnement visuel (entre Tabs et Autocall)
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.3_

- [ ] 4. Importer et configurer AnnuaireTable
  - Importer le composant AnnuaireTable depuis @/components/AnnuaireTable
  - Créer les handlers pour onToggleSelection, onToggleSelectAll, onContactClick

  - Convertir selectedContactId en Set pour la prop selectedIds
  - Préparer toutes les props nécessaires pour AnnuaireTable
  - _Requirements: 2.2, 3.1, 3.2, 3.4_

- [ ] 5. Implémenter le rendu conditionnel
  - Wrapper le code existant de la vue cards dans une condition `viewMode === 'cards'`

  - Ajouter la condition `viewMode === 'table'` avec AnnuaireTable
  - Passer les contacts convertis à AnnuaireTable
  - Vérifier que les deux vues s'affichent correctement
  - _Requirements: 1.2, 1.3, 2.1, 2.2_

- [x] 6. Implémenter les handlers de sélection pour la vue table

  - Créer handleToggleSelection pour gérer la sélection d'un contact
  - Créer handleToggleSelectAll pour gérer la sélection de tous les contacts
  - Créer handleContactClick pour gérer le clic sur un contact
  - Vérifier que la sélection fonctionne dans les deux sens (table → détails)
  - _Requirements: 2.5, 3.4, 5.1_


- [ ] 7. Vérifier la préservation du contexte lors du changement de vue
  - Tester que les filtres (tabs, recherche) sont préservés
  - Tester que la sélection de contact est préservée
  - Tester que le scroll est réinitialisé au top
  - Vérifier qu'aucun rechargement de données n'est nécessaire
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Vérifier la cohérence des fonctionnalités entre les vues

  - Tester les actions de sélection multiple (suppression)
  - Tester les filtres de tabs (Désactivé, LinkedIn, Google, Lien)
  - Tester le tri des données dans la table
  - Tester les actions d'export (CSV, Excel)
  - Tester les actions d'import (CSV, Excel)
  - Tester le bouton Autocall
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_



- [ ] 9. Vérifier le responsive design
  - Tester sur mobile (< 768px)
  - Tester sur tablette (768px - 1024px)
  - Tester sur desktop (> 1024px)
  - Vérifier le scroll horizontal de la table sur petits écrans
  - Vérifier que le ViewSwitcher reste visible et accessible
  - _Requirements: 6.2, 7.1, 7.2_

- [ ] 10. Vérifier l'accessibilité
  - Tester la navigation au clavier (Tab, Enter)
  - Vérifier les labels ARIA du ViewSwitcher
  - Tester avec un lecteur d'écran
  - Vérifier le contraste des couleurs
  - Vérifier que les raccourcis clavier (F1-F10) fonctionnent dans la vue table
  - _Requirements: 6.5, 7.3, 7.4, 7.5_
