# Implementation Plan - Optimisation de Performance de la Table Appels

## Overview

Ce plan d'implémentation transforme le design technique en tâches concrètes et exécutables. L'objectif est de migrer la table "Appels" vers une architecture performante utilisant TanStack Table v8 et TanStack Virtual v3, tout en préservant 100% des fonctionnalités existantes.

**Durée Estimée Totale:** 8-10 jours de développement

**Approche:** Développement incrémental avec feature flag pour rollout progressif

---

## Tasks

- [x] 1. Créer le composant VirtualizedContactTable de base


  - Créer le fichier `src/components/VirtualizedContactTable.tsx`
  - Définir l'interface `VirtualizedContactTableProps` identique à `ContactTableProps`
  - Définir l'interface `VirtualizedContactTableRef` avec `scrollToContact` et `openImportMapping`
  - Implémenter le composant avec forwardRef pour exposer les méthodes via ref
  - Créer la structure HTML de base avec Table, TableHeader, TableBody (shadcn/ui)
  - Ajouter les refs nécessaires (`scrollContainerRef`, `shouldAutoScrollRef`)
  - _Requirements: 1.1, 1.2, 4.1, 4.2_



- [ ] 2. Intégrer TanStack Table pour la gestion headless
  - [ ] 2.1 Configurer useReactTable avec les options de base
    - Importer `useReactTable`, `getCoreRowModel`, `getSortedRowModel` depuis `@tanstack/react-table`
    - Créer l'état de tri avec `useState<SortingState>([])`
    - Créer l'état de visibilité des colonnes avec `useState<VisibilityState>({})`
    - Créer l'état d'ordre des colonnes avec `useState<string[]>([])`
    - Initialiser les états depuis localStorage avec les clés existantes

    - Configurer `useReactTable` avec data, columns, state, et callbacks
    - _Requirements: 5.1, 5.2, 6.1, 6.2_
  
  - [ ] 2.2 Créer les définitions de colonnes dynamiques
    - Utiliser `useMemo` pour créer le tableau `columns` de type `ColumnDef<Contact>[]`
    - Mapper `columnHeaders` et `contactDataKeys` vers les définitions de colonnes
    - Définir `accessorKey` pour chaque colonne basé sur `contactDataKeys`
    - Configurer `enableSorting: true` pour toutes les colonnes
    - Configurer `enableHiding` basé sur les colonnes essentielles (#, Prénom, Nom, Commentaire)

    - Créer le composant `header` avec `SortableHeaderCell`
    - Créer le composant `cell` avec `MemoizedCell`
    - _Requirements: 5.1, 6.1, 6.2_
  
  - [ ] 2.3 Implémenter la persistance de la configuration
    - Créer la fonction `saveToLocalStorage` avec gestion d'erreur try/catch
    - Créer la fonction `loadFromLocalStorage` avec fallback sur valeur par défaut
    - Persister `sorting` dans localStorage avec clé 'dimicall-sort-config'
    - Persister `columnVisibility` dans localStorage avec clé 'appels2-visible-columns'
    - Persister `columnOrder` dans localStorage avec clé 'dimicall-column-order'


    - Restaurer les états depuis localStorage au montage du composant
    - _Requirements: 5.3, 5.4, 6.3, 6.4_


- [ ] 3. Intégrer TanStack Virtual pour la virtualisation des lignes
  - [ ] 3.1 Configurer useVirtualizer
    - Importer `useVirtualizer` depuis `@tanstack/react-virtual`
    - Configurer `count` avec `table.getRowModel().rows.length`

    - Configurer `getScrollElement` pour retourner `scrollContainerRef.current`
    - Définir `estimateSize: () => 40` pour la hauteur estimée des lignes
    - Définir `overscan: 10` pour le buffer de lignes au-dessus/en-dessous
    - Configurer `measureElement` avec détection de Firefox (désactiver sur Firefox)
    - Ajouter `enabled: !!scrollContainerRef.current` pour éviter les erreurs
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 3.2 Implémenter le rendu virtualisé du TableBody
    - Récupérer `virtualRows` avec `rowVirtualizer.getVirtualItems()`
    - Calculer `totalSize` avec `rowVirtualizer.getTotalSize()`

    - Calculer `paddingTop` basé sur `virtualRows[0]?.start || 0`
    - Calculer `paddingBottom` basé sur `totalSize - virtualRows[last]?.end`
    - Rendre une ligne de padding supérieur si `paddingTop > 0`
    - Mapper `virtualRows` pour rendre les lignes visibles
    - Rendre une ligne de padding inférieur si `paddingBottom > 0`
    - Appliquer `position: relative` au TableBody pour le positionnement absolu
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 3.3 Implémenter scrollToContact via ref
    - Créer la fonction `scrollToContact` avec `useCallback`



    - Vérifier que `scrollContainerRef.current` existe
    - Trouver l'index de la ligne avec `table.getRowModel().rows.findIndex`
    - Logger un warning si le contact n'est pas trouvé
    - Appeler `rowVirtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' })`
    - Gérer les erreurs avec try/catch et toast.error
    - Exposer `scrollToContact` via `useImperativeHandle`
    - _Requirements: 7.1, 7.2, 7.3, 7.5_


- [ ] 4. Créer les composants memoized pour optimiser les re-renders
  - [ ] 4.1 Créer MemoizedTableRow
    - Définir l'interface `MemoizedTableRowProps` avec row, virtualRow, isSelected, isActiveCall, callState, onSelect, theme
    - Créer le composant avec `React.memo`
    - Appliquer les classes CSS conditionnelles (hover, selected, activeCall)
    - Appliquer les styles inline pour le positionnement virtuel (height, transform)
    - Ajouter `data-contact-id` et `data-index` pour le debugging
    - Ajouter `ref={rowVirtualizer.measureElement}` pour la mesure dynamique

    - Mapper `row.getVisibleCells()` pour rendre les cellules
    - Créer le comparateur personnalisé pour éviter les re-renders inutiles
    - _Requirements: 1.4, 3.1, 3.2, 4.3, 4.4, 4.5_
  
  - [ ] 4.2 Créer MemoizedCell
    - Définir l'interface `MemoizedCellProps` avec cell, contact, isSelected, theme
    - Créer le composant avec `React.memo`
    - Appliquer les classes CSS de base (px-2, py-1.5, text-xs, text-center)
    - Wrapper le contenu dans un div avec min-h-[32px]
    - Appeler `renderCellContent` pour le contenu de la cellule
    - Créer le comparateur personnalisé basé sur cell.id et la valeur de la cellule
    - _Requirements: 1.4, 3.1, 3.2_

  
  - [ ] 4.3 Créer SortableHeaderCell
    - Définir l'interface `SortableHeaderCellProps` avec column, label, icon
    - Créer le composant avec `React.memo`
    - Appliquer les styles sticky header inline (position, zIndex, backgroundColor, backdropFilter)

    - Ajouter `willChange: 'transform'` et `transform: 'translateZ(0)'` pour GPU acceleration
    - Afficher l'icône de la colonne depuis TABLE_HEADER_ICONS
    - Afficher l'indicateur de tri (ArrowUp, ArrowDown, ArrowUpDown)
    - Gérer le clic pour déclencher `column.toggleSorting()`
    - Appliquer cursor-pointer et hover:bg-muted si la colonne est triable
    - _Requirements: 4.2, 5.1, 5.2_



- [ ] 5. Implémenter renderCellContent avec tous les widgets existants
  - [ ] 5.1 Créer la fonction renderCellContent
    - Définir la signature `(contact: Contact, columnKey: keyof Contact, theme: Theme) => ReactNode`
    - Créer un switch statement basé sur `columnKey`
    - Retourner un span avec 'N/A' pour le cas default

    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.6_
  
  - [ ] 5.2 Implémenter les widgets de statut et commentaire
    - Case 'statut': Rendre StatusSelect avec value, onChange, triggerClassName, size
    - Appeler `debouncedUpdate` dans onChange avec debounce de 300ms
    - Case 'commentaire': Rendre CommentWidget avec value, onChange, theme
    - Appeler `debouncedUpdate` dans onChange avec debounce de 300ms
    - _Requirements: 2.1, 2.2, 3.1, 3.2_

  
  - [ ] 5.3 Implémenter les widgets de date et heure
    - Case 'dateRappel': Rendre DateTimeCell + Button avec icône Bell
    - Gérer le clic sur Bell pour ouvrir ReminderDialog avec `e.stopPropagation()`
    - Cases 'dateRDV', 'dateAppel': Rendre DateTimeCell type="date"
    - Cases 'heureRappel', 'heureRDV', 'heureAppel': Rendre DateTimeCell type="time"
    - Appeler `debouncedUpdate` dans onChange avec debounce de 500ms
    - _Requirements: 2.3, 2.4, 2.6, 3.1, 3.2_
  
  - [ ] 5.4 Implémenter l'édition inline pour les champs texte
    - Cases 'prenom', 'nom', 'telephone', 'email', 'source': Rendre EditableCell
    - Gérer le double-click pour activer le mode édition
    - Mettre à jour `editingCell` state avec contactId et field
    - Afficher Input si `editingCell` correspond à cette cellule

    - Gérer onBlur pour commit avec `debouncedUpdate` (debounce 1000ms)
    - Gérer onKeyDown pour Enter (commit) et Escape (cancel)
    - _Requirements: 2.5, 3.1, 3.2_

  
  - [ ] 5.5 Implémenter les champs spéciaux
    - Case 'numeroLigne': Afficher l'index + 1 avec style font-medium text-center
    - Case 'telephone': Formater avec `formatPhoneNumber` et style font-mono
    - Case 'dureeAppel': Afficher avec style text-center
    - Case 'lien': Afficher avec truncate et max-w-[180px]
    - _Requirements: 2.1, 4.6_


- [ ] 6. Créer le hook useDebouncedUpdate pour optimiser les sauvegardes
  - Créer le fichier `src/hooks/useDebouncedUpdate.ts`
  - Importer `useMemo`, `useEffect` de React et `debounce` de lodash
  - Créer le hook avec signature `(onUpdateContact, delays) => debouncedUpdate`
  - Définir `delays` avec commentaire: 300ms, date: 500ms, text: 1000ms
  - Créer `debouncedUpdate` avec `useMemo` et `debounce`

  - Gérer les erreurs avec try/catch et toast.error
  - Cleanup avec `useEffect` return pour cancel les debounced functions
  - Retourner `debouncedUpdate` function
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Implémenter les dialogues et overlays
  - [ ] 7.1 Intégrer ReminderDialog
    - Créer l'état `reminderDialog` avec `useState<{ isOpen: boolean, contact: Contact | null }>`


    - Créer `handleOpenReminderDialog` pour ouvrir le dialogue
    - Créer `handleCloseReminderDialog` pour fermer le dialogue
    - Créer `handleSaveReminder` pour sauvegarder dateRappel et heureRappel
    - Rendre ReminderDialog avec isOpen, onClose, contact, initialDate, initialTime, onSave
    - _Requirements: 2.6, 9.2_

  
  - [ ] 7.2 Intégrer ImportMappingDialog
    - Créer l'état `mappingDialog` avec file, headers, preview
    - Créer `analyzeAndOpenMappingDialog` pour parser le fichier
    - Créer `handleImportConfirm` pour traiter l'import

    - Rendre ImportMappingDialog avec isOpen, onClose, fileName, detectedHeaders, previewRows, expectedTargets, requiredTargets, onConfirm
    - Exposer `openImportMapping` via `useImperativeHandle`
    - _Requirements: 9.1_
  
  - [ ] 7.3 Intégrer DropZoneOverlay
    - Créer les états `isDragOver` et `isDragActive`

    - Créer les handlers `handleDragEnter`, `handleDragOver`, `handleDragLeave`, `handleDrop`
    - Appliquer les handlers sur le div conteneur principal
    - Rendre DropZoneOverlay avec isVisible et isDragActive
    - _Requirements: 9.1_



- [ ] 8. Gérer la pagination avec VirtualizedContactTable
  - [ ] 8.1 Modifier PaginatedContactTable pour utiliser VirtualizedContactTable
    - Importer VirtualizedContactTable au lieu de ContactTable
    - Passer `paginatedData` au lieu de `contacts` à VirtualizedContactTable
    - Conserver tous les autres props identiques
    - Vérifier que la ref est correctement forwardée
    - _Requirements: 8.1, 8.4_

  
  - [ ] 8.2 Implémenter le reset du scroll lors du changement de page
    - Dans `handlePageChange` de PaginatedContactTable
    - Appeler `ref.current?.scrollToContact(paginatedData[0]?.id)` si disponible
    - Sinon, scroll vers le haut avec `window.scrollTo({ top: 0, behavior: 'smooth' })`
    - _Requirements: 8.2_

  

  - [ ] 8.3 Recalculer la virtualisation lors du changement de taille de page
    - Dans `handleItemsPerPageChange` de PaginatedContactTable
    - Le virtualizer se recalcule automatiquement via `count: table.getRowModel().rows.length`
    - Persister `itemsPerPage` dans localStorage
    - _Requirements: 8.3_

- [x] 9. Implémenter le feature flag pour rollout progressif

  - [ ] 9.1 Créer le state du feature flag dans AppelsCardsView
    - Créer `useVirtualizedTable` state avec `useState`
    - Initialiser depuis localStorage avec clé 'dimicall-use-virtualized-table'
    - Créer `setUseVirtualizedTable` pour toggle le flag
    - Persister dans localStorage lors du changement
    - _Requirements: Migration Phase 2_

  
  - [ ] 9.2 Implémenter le rendu conditionnel
    - Dans AppelsCardsView, condition `viewMode === 'table'`
    - Si `useVirtualizedTable === true`, rendre VirtualizedContactTable

    - Sinon, rendre PaginatedContactTable (ancien)

    - Passer les mêmes props aux deux composants
    - Forwarder la ref correctement
    - _Requirements: Migration Phase 2_
  
  - [x] 9.3 Ajouter un toggle dans les settings (optionnel)

    - Créer un Switch dans les paramètres de l'application
    - Label: "Utiliser la nouvelle table optimisée (Beta)"
    - Lier à `useVirtualizedTable` state
    - Afficher un tooltip expliquant les bénéfices
    - _Requirements: Migration Phase 2_


- [ ] 10. Créer les tests unitaires
  - [ ] 10.1 Tests pour VirtualizedContactTable
    - Test: should render only visible rows (~40 lignes max)
    - Test: should scroll to contact when scrollToContact is called
    - Test: should preserve all cell widgets (StatusSelect, CommentWidget, DateTimeCell)

    - Test: should handle empty contacts array

    - Test: should handle missing scrollElement ref
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 10.2 Tests pour MemoizedTableRow
    - Test: should not re-render when unrelated props change

    - Test: should re-render when contact data changes
    - Test: should re-render when isSelected changes
    - Test: should apply correct CSS classes based on state
    - _Requirements: 10.1, 10.2_
  
  - [ ] 10.3 Tests pour useDebouncedUpdate
    - Test: should debounce updates with correct delays

    - Test: should cancel pending updates on unmount
    - Test: should handle errors gracefully
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 11. Créer les tests de performance

  - [x] 11.1 Test de temps de chargement

    - Test: should load 1000 contacts in < 500ms
    - Mesurer avec performance.now()
    - Vérifier que les lignes sont rendues
    - _Requirements: 10.5_
  

  - [ ]* 11.2 Test de frame rate pendant le scroll
    - Test: should maintain 60 FPS during scroll
    - Simuler un scroll rapide sur 100 frames
    - Mesurer le temps entre chaque frame
    - Vérifier que 90% des frames sont < 16.67ms
    - _Requirements: 10.3_

  
  - [ ]* 11.3 Test de mémoire
    - Test: should use < 200MB memory with 1000 contacts
    - Utiliser performance.memory si disponible

    - Mesurer usedJSHeapSize avant et après

    - _Requirements: 10.4_


- [ ]* 12. Créer les tests d'intégration
  - [ ]* 12.1 Test avec pagination
    - Test: should work with pagination

    - Vérifier que seulement 25 contacts sont passés à VirtualizedContactTable
    - Vérifier que le nombre de lignes rendues est < 35
    - _Requirements: 10.1, 10.2_
  


  - [x]* 12.2 Test de préservation de la sélection

    - Test: should preserve selection across pagination
    - Sélectionner un contact sur page 1
    - Naviguer vers page 2
    - Revenir à page 1
    - Vérifier que la sélection est préservée
    - _Requirements: 10.1, 10.2_

  
  - [ ]* 12.3 Test avec tri
    - Test: should work with sorting
    - Cliquer sur l'en-tête "Nom" pour trier
    - Vérifier que les contacts sont triés alphabétiquement
    - Vérifier que la virtualisation fonctionne toujours

    - _Requirements: 10.1, 10.2_

- [ ] 13. Optimiser les performances CSS et animations
  - [ ] 13.1 Supprimer les animations Framer Motion
    - Remplacer `motion.tr` par `tr` dans MemoizedTableRow
    - Supprimer les props `initial`, `animate`, `transition`
    - Conserver seulement `className="transition-colors duration-150"`
    - _Requirements: 1.2, 1.3_
  
  - [ ] 13.2 Optimiser le sticky header
    - Appliquer `willChange: 'transform'` sur le TableHeader
    - Appliquer `transform: 'translateZ(0)'` pour GPU acceleration
    - Utiliser `backdropFilter: 'blur(8px)'` pour l'effet de flou
    - Vérifier que le header reste fixe pendant le scroll
    - _Requirements: 4.2_
  
  - [ ] 13.3 Optimiser le positionnement des lignes
    - Utiliser `transform: translateY()` au lieu de `top` pour les lignes
    - Appliquer `position: absolute` sur les lignes virtuelles
    - Vérifier que le scroll est fluide à 60 FPS
    - _Requirements: 1.2, 1.3_

- [ ] 14. Ajouter le monitoring et le debugging
  - [ ] 14.1 Ajouter les logs de debug en développement
    - Créer une constante `DEBUG = process.env.NODE_ENV === 'development'`
    - Logger les stats de rendu (totalContacts, visibleRows, virtualizedRange, totalSize)
    - Logger les warnings si le temps de rendu > 100ms
    - Logger les erreurs de scroll avec contexte
    - _Requirements: 10.1, 10.2_
  
  - [ ] 14.2 Ajouter le tracking des métriques de performance
    - Mesurer le temps de chargement initial avec performance.now()
    - Envoyer les métriques à un service d'analytics (optionnel)
    - Logger les métriques dans la console en mode debug
    - _Requirements: 10.1, 10.5_

- [ ] 15. Documentation et cleanup
  - [ ] 15.1 Documenter VirtualizedContactTable
    - Ajouter des JSDoc comments pour le composant
    - Documenter les props avec descriptions
    - Documenter les méthodes exposées via ref
    - Ajouter des exemples d'utilisation
    - _Requirements: Migration Phase 5_
  
  - [ ] 15.2 Créer un guide de migration
    - Documenter les différences entre ContactTable et VirtualizedContactTable
    - Expliquer comment activer/désactiver le feature flag
    - Documenter les métriques de performance attendues
    - Créer un changelog détaillé
    - _Requirements: Migration Phase 5_
  
  - [ ] 15.3 Cleanup du code (après validation)
    - Supprimer l'ancien ContactTable.tsx (après rollout complet)
    - Renommer VirtualizedContactTable.tsx en ContactTable.tsx
    - Supprimer le feature flag et le code conditionnel
    - Mettre à jour les imports dans tous les fichiers
    - _Requirements: Migration Phase 5_

---

## Notes d'Implémentation

### Ordre d'Exécution Recommandé

1. **Phase 1 (Jours 1-3):** Tâches 1-7 (Composant de base + TanStack Table + TanStack Virtual + Widgets)
2. **Phase 2 (Jour 4):** Tâches 8-9 (Pagination + Feature Flag)
3. **Phase 3 (Jours 5-6):** Tâches 10-12 (Tests)
4. **Phase 4 (Jour 7):** Tâches 13-14 (Optimisations + Monitoring)
5. **Phase 5 (Jour 8):** Tâche 15 (Documentation)

### Dépendances Critiques

- Tâche 2 dépend de Tâche 1
- Tâche 3 dépend de Tâche 2
- Tâche 4 dépend de Tâche 3
- Tâche 5 dépend de Tâche 4
- Tâche 8 dépend de Tâches 1-7
- Tâche 9 dépend de Tâche 8
- Tâches 10-12 peuvent être faites en parallèle après Tâche 9

### Points d'Attention

- **Ne pas supprimer l'ancien ContactTable** avant validation complète
- **Tester sur Firefox** car measureElement peut causer des problèmes
- **Vérifier la compatibilité Electron** avec des paramètres ajustés
- **Monitorer la mémoire** pendant les tests avec 1000+ contacts
- **Valider visuellement** que l'UI est 100% identique

