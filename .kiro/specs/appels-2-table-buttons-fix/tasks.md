# Implementation Plan - Correction des boutons non fonctionnels dans Appels 2 (mode Table)

- [x] 1. Mise à jour de l'interface PaginatedContactTable


  - Ajouter les props pour les handlers d'action (onCall, onEmail, onSmsMonsieur, onSmsMadame, onRappel, onRendezVous, onCalCom, onQualification, onLinkedInSearch, onGoogleSearch, onDirectLink, adbConnected)
  - Rendre ces props optionnels avec le type `?` pour ne pas casser l'existant
  - Transmettre ces props au composant ContactTable
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.1_



- [ ] 2. Mise à jour de l'interface ContactTable
  - Ajouter les mêmes props pour les handlers d'action
  - Rendre ces props optionnels


  - Ajouter un useEffect pour logger un warning si certains handlers ne sont pas fournis
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.1_

- [ ] 3. Ajout de la colonne "Actions" dans ContactTable
  - Créer la configuration de la colonne Actions dans dynamicColumns
  - Ajouter les imports nécessaires (Tooltip, TooltipProvider, TooltipTrigger, TooltipContent, DropdownMenu, etc.)
  - Implémenter le rendu de la cellule Actions avec tous les boutons
  - Ajouter le bouton "Appeler" avec tooltip et gestion du disabled
  - Ajouter le bouton "SMS" avec dropdown (Monsieur/Madame)
  - Ajouter le bouton "Email" avec tooltip
  - Ajouter le bouton "Qualification" avec tooltip
  - Ajouter le bouton "Rappel" avec tooltip
  - Ajouter le bouton "Rendez-vous" avec tooltip


  - Ajouter le bouton "Cal.com" avec tooltip
  - Gérer la sélection du contact avant chaque action avec `onSelectContact(contact)`
  - Utiliser `e.stopPropagation()` pour éviter la sélection de la ligne lors du clic sur un bouton
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 4.1, 4.2_



- [ ] 4. Transmission des handlers depuis AppelsCardsView
  - Dans AppelsCardsView, transmettre tous les handlers d'action à PaginatedContactTable
  - Ajouter les props : onCall, onHangUp, onEmail, onSmsMonsieur, onSmsMadame, onRappel, onRendezVous, onCalCom, onQualification, onLinkedInSearch, onGoogleSearch, onDirectLink, adbConnected
  - Vérifier que tous les handlers sont bien transmis
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.1_



- [ ] 5. Activation des boutons de la navbar en mode table
  - Supprimer la condition `viewMode === 'cards'` qui entoure les boutons de la navbar
  - Vérifier que les boutons Importer, Exporter, Supprimer sont visibles en mode table



  - Vérifier que le sélecteur de mode de recherche automatique (Tabs) est visible en mode table
  - Vérifier que le bouton Autocall est visible en mode table
  - S'assurer que tous les handlers (onImportDialog, onExportDialog, onClearActiveTab) sont appelés correctement
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1_

- [ ] 6. Activation du sélecteur d'onglet en mode table
  - Vérifier que le sélecteur d'onglet (dropdown "Contacts") est visible en mode table
  - S'assurer qu'il n'y a pas de condition qui le désactive en mode table
  - Vérifier que le changement d'onglet fonctionne correctement
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1_

- [ ] 7. Tests et validation
  - Tester le bouton "Appeler" en mode table
  - Tester le bouton "SMS" avec les deux options (Monsieur/Madame)
  - Tester le bouton "Email"
  - Tester le bouton "Qualification"
  - Tester le bouton "Rappel"
  - Tester le bouton "Rendez-vous"
  - Tester le bouton "Cal.com"
  - Tester le bouton "Importer" avec un fichier CSV/Excel
  - Tester le bouton "Exporter"
  - Tester le bouton "Supprimer" avec confirmation
  - Tester le sélecteur d'onglet
  - Vérifier que les tooltips s'affichent correctement
  - Vérifier que les boutons sont désactivés quand aucun contact n'est sélectionné
  - Vérifier la cohérence avec la page "Appels" originale
  - Tester le basculement entre modes cards et table
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_
