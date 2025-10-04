# Implementation Plan - Alignement des fonctionnalités Appels 2

## Phase 1: Composants de base avec boutons d'effacement

- [x] 1. Créer les composants de sélection date/heure avec boutons X


  - Créer `src/components/DatePickerWithClear.tsx` avec Calendar de shadcn/ui
  - Créer `src/components/TimePickerWithClear.tsx` avec Select et ScrollArea de shadcn/ui
  - Ajouter les boutons X qui apparaissent uniquement quand une valeur est sélectionnée
  - Implémenter la logique d'effacement qui appelle `onChange('')`
  - Utiliser les composants Button, Label, Popover de shadcn/ui
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_



- [ ] 2. Intégrer les nouveaux composants dans AppelsCardsView
  - Remplacer les composants DatePickerField et TimeSelectField existants
  - Passer les props `value`, `onChange`, et `onClear` appropriées
  - Connecter `onClear` à `handleFormChange` avec une valeur vide


  - Tester que les valeurs sont correctement effacées et sauvegardées
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_

- [ ] 3. Créer le widget Zap pour commentaires rapides
  - Créer `src/components/ZapWidget.tsx`
  - Utiliser Textarea, Select, SelectTrigger, SelectContent, SelectItem de shadcn/ui


  - Importer QUICK_COMMENTS depuis `src/constants.tsx`
  - Implémenter la logique de concaténation: `value ? ${value} ${comment}` : comment`
  - Ajouter l'icône Zap de lucide-react
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4. Intégrer ZapWidget dans le champ Notes
  - Remplacer le Textarea simple par ZapWidget dans AppelsCardsView


  - Passer `value={noteDraft}`, `onChange={setNoteDraft}`, et `quickComments={QUICK_COMMENTS}`
  - Vérifier que les commentaires rapides s'ajoutent correctement
  - Tester la sauvegarde des commentaires avec le bouton Sauvegarder
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

## Phase 2: Recherche automatique et filtres



- [ ] 5. Créer le composant AutoSearchDropdown
  - Créer `src/components/AutoSearchDropdown.tsx`
  - Utiliser DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem de shadcn/ui
  - Ajouter les icônes Linkedin, Globe, ExternalLink, X de lucide-react


  - Implémenter les props: selectedContact, onLinkedInSearch, onGoogleSearch, onDirectLink, autoSearchMode, onAutoSearchModeChange
  - Désactiver "Lien direct" quand `!selectedContact?.lien`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. Ajouter la persistance du mode automatique


  - Créer la constante `AUTO_SEARCH_MODE_KEY = 'dimicall-auto-search-mode'`
  - Implémenter `saveAutoSearchMode` et `loadAutoSearchMode` dans AutoSearchDropdown
  - Sauvegarder dans localStorage lors du changement de mode
  - Restaurer le mode au montage du composant
  - _Requirements: 2.7, 2.8_



- [ ] 7. Implémenter le déclenchement automatique
  - Ajouter un useEffect dans AutoSearchDropdown qui écoute `selectedContact?.id` et `autoSearchMode`
  - Déclencher la recherche appropriée selon le mode sélectionné
  - Ignorer si mode === 'disabled' ou si aucun contact n'est sélectionné
  - Ajouter une gestion d'erreur avec toast pour les contacts sans informations



  - _Requirements: 2.4, 2.5_

- [ ] 8. Intégrer AutoSearchDropdown dans la navbar
  - Ajouter l'état `autoSearchMode` dans AppelsCardsView
  - Initialiser avec `loadAutoSearchMode()` au montage
  - Placer AutoSearchDropdown entre le bouton Filter et le bouton Import


  - Passer toutes les props nécessaires incluant les callbacks de recherche existants
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 9. Rendre les filtres rapides fonctionnels
  - Créer la fonction `applyFilter(contacts, filterType)` dans AppelsCardsView
  - Implémenter la logique pour 'rappel': filtrer par `dateRappel === today`


  - Implémenter la logique pour 'rdv': filtrer par `!!dateRDV`
  - Implémenter la logique pour 'status': filtrer par `!statut || statut === ContactStatus.NonDefini`
  - Ajouter l'état `activeFilter` et l'utiliser pour filtrer `displayedContacts`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 10. Mettre à jour le dropdown de filtres


  - Connecter chaque DropdownMenuItem à `applyFilter` avec le bon type
  - Ajouter un indicateur visuel sur le bouton Filter quand un filtre est actif
  - Utiliser Badge de shadcn/ui pour afficher le nombre de résultats filtrés
  - Fermer le dropdown après sélection d'un filtre
  - _Requirements: 3.1, 3.6, 3.7_



## Phase 3: Import avec mapping et drag & drop

- [ ] 11. Créer le composant DropZoneOverlay
  - Créer `src/components/DropZoneOverlay.tsx`
  - Utiliser Card de shadcn/ui avec border-dashed


  - Ajouter l'icône Upload de lucide-react
  - Implémenter les props: isVisible, isDragActive
  - Appliquer des styles conditionnels selon isDragActive
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 12. Implémenter la logique de drag & drop



  - Ajouter les états `isDragOver` et `isDragActive` dans AppelsCardsView
  - Implémenter les handlers: onDragEnter, onDragOver, onDragLeave, onDrop
  - Valider le type de fichier dans onDrop (.csv, .tsv, .xlsx, .xls)
  - Afficher un toast d'erreur pour les fichiers invalides
  - Déclencher le processus d'import pour les fichiers valides

  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 13. Intégrer DropZoneOverlay dans AppelsCardsView
  - Ajouter DropZoneOverlay au render avec les états isDragOver et isDragActive
  - Attacher les handlers de drag & drop au conteneur principal
  - Tester le glisser-déposer de différents types de fichiers
  - Vérifier que l'overlay s'affiche et se masque correctement
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 14. Créer le composant ImportProgressBar
  - Créer `src/components/ImportProgressBar.tsx`
  - Utiliser Progress et Card de shadcn/ui
  - Implémenter les props: progress, message, isVisible
  - Positionner en fixed bottom-right avec z-50
  - Ajouter une animation de fade-out après complétion




  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Connecter ImportMappingDialog au bouton Importer
  - Ajouter l'état `mappingDialog` dans AppelsCardsView
  - Créer la fonction `handleFileSelect` qui analyse le fichier
  - Extraire les headers et preview avec XLSX ou parseCSV
  - Ouvrir ImportMappingDialog avec les données extraites
  - Importer le composant ImportMappingDialog existant
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 16. Implémenter le callback de confirmation d'import
  - Créer la fonction `handleImportConfirm(mapping, options)`
  - Appeler `importContactsFromFile` avec le mapping validé





  - Afficher ImportProgressBar pendant le traitement
  - Mettre à jour les contacts via `onUpdateContact` ou callback parent
  - Afficher un toast de succès avec le nombre de contacts importés
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 7.1, 7.2, 7.5_

- [ ] 17. Gérer les erreurs d'import
  - Ajouter un try-catch autour de `importContactsFromFile`
  - Afficher un toast d'erreur avec le message approprié

  - Masquer ImportProgressBar en cas d'erreur
  - Logger l'erreur dans la console pour debug
  - Fermer ImportMappingDialog après erreur
  - _Requirements: 1.7, 7.4_

## Phase 4: Améliorations UX et finalisation




- [ ] 18. Implémenter le scroll automatique vers le contact sélectionné
  - Créer la fonction `scrollToContact(contactId)` dans AppelsCardsView
  - Utiliser `scrollRef.current?.querySelector` pour trouver la carte
  - Appeler `scrollIntoView({ behavior: 'smooth', block: 'center' })`
  - Ajouter un useEffect qui écoute `selectedContactId`
  - Vérifier si le contact est déjà visible avant de scroller
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 19. Gérer le scroll pour les contacts non chargés
  - Vérifier si le contact est au-delà de `visibleCount`
  - Augmenter `visibleCount` jusqu'à inclure le contact
  - Attendre le render avec un setTimeout avant de scroller
  - Tester avec des listes de plus de 40 contacts
  - _Requirements: 9.3_

- [ ] 20. Ajouter les toast notifications de sauvegarde
  - Importer `toast` depuis 'sonner'
  - Ajouter `toast.success` après sauvegarde réussie dans `handleSave`
  - Ajouter `toast.error` en cas d'échec de sauvegarde
  - Afficher un loader sur le bouton Sauvegarder pendant `isSaving`
  - Désactiver le bouton pendant la sauvegarde
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 21. Tester l'intégration complète
  - Tester l'import d'un fichier CSV avec mapping automatique
  - Tester l'import d'un fichier Excel avec mapping manuel
  - Tester le drag & drop de fichiers
  - Tester la recherche automatique avec les 3 modes
  - Tester tous les filtres rapides
  - Tester les boutons X sur dates et heures
  - Tester le widget Zap avec plusieurs commentaires
  - Tester le scroll automatique
  - Vérifier que toutes les préférences sont persistées
  - Vérifier la responsivité sur mobile/tablet/desktop
  - _Requirements: Tous_

- [ ] 22. Optimisations de performance
  - Ajouter `useMemo` pour `filteredContacts` avec dépendances précises
  - Ajouter `useCallback` pour les handlers de drag & drop
  - Vérifier qu'il n'y a pas de re-renders inutiles avec React DevTools
  - Tester avec une liste de 1000+ contacts
  - Optimiser le scroll automatique avec `requestAnimationFrame` si nécessaire
  - _Requirements: Performance_

- [ ] 23. Documentation et nettoyage
  - Ajouter des commentaires JSDoc sur les nouveaux composants
  - Documenter les props de chaque composant
  - Nettoyer les imports inutilisés
  - Vérifier que tous les composants shadcn/ui sont correctement importés
  - Mettre à jour le README si nécessaire
  - _Requirements: Documentation_
