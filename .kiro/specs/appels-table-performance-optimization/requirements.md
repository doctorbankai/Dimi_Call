# Requirements Document - Optimisation de Performance de la Table Appels

## Introduction

Ce document définit les exigences pour l'optimisation de performance de la table "Appels" dans DimiCall. La table actuelle utilise uniquement les composants shadcn/ui basiques (Table, TableRow, TableCell) sans bibliothèque de gestion de table, ce qui cause des problèmes de performance majeurs avec plus de 1000 lignes. Toutes les interactions (scroll, édition, tri, filtrage) sont extrêmement lentes car TOUTES les lignes sont rendues dans le DOM. L'objectif est de migrer vers TanStack Table v8 pour la gestion de table headless et TanStack Virtual v3 pour la virtualisation des lignes, tout en préservant 100% des fonctionnalités existantes et l'apparence visuelle.

## Glossary

- **ContactTable Component**: Le composant React principal qui affiche la table des contacts avec édition inline
- **TanStack Table**: Bibliothèque headless UI (v8) pour construire des tables performantes avec tri, filtrage et gestion de colonnes
- **TanStack Virtual**: Bibliothèque headless UI (v3) pour virtualiser de grandes listes en ne rendant que les éléments visibles
- **Row Virtualization**: Technique de rendu qui n'affiche que les lignes visibles dans le viewport plus un buffer
- **Inline Editing**: Capacité d'éditer les cellules directement dans la table sans dialogue modal
- **Sticky Header**: En-tête de table qui reste fixe lors du scroll vertical
- **Debouncing**: Technique pour retarder l'exécution d'une fonction jusqu'à ce qu'un certain temps se soit écoulé depuis le dernier appel
- **Memoization**: Technique d'optimisation qui met en cache les résultats de calculs coûteux
- **Re-render**: Processus par lequel React met à jour le DOM en réponse à des changements d'état

## Requirements

### Requirement 1: Performance de Rendu avec Virtualisation

**User Story:** En tant qu'utilisateur avec plus de 1000 contacts, je veux que la table se charge instantanément et reste fluide lors du scroll, afin de pouvoir naviguer efficacement dans mes données.

#### Acceptance Criteria

1. WHEN THE ContactTable Component contient plus de 100 contacts, THE ContactTable Component SHALL render uniquement les lignes visibles dans le viewport plus un buffer de 10 lignes au-dessus et en-dessous
2. WHEN THE utilisateur scroll verticalement dans la table, THE ContactTable Component SHALL mettre à jour dynamiquement les lignes rendues en moins de 16ms pour maintenir 60 FPS
3. WHEN THE table affiche 1000+ contacts, THE ContactTable Component SHALL charger l'interface initiale en moins de 500ms
4. WHEN THE utilisateur interagit avec une cellule, THE ContactTable Component SHALL limiter les re-renders aux seules cellules affectées via React.memo et useMemo
5. WHEN THE table virtualise les lignes, THE ContactTable Component SHALL maintenir une hauteur totale précise pour que la scrollbar reflète le nombre réel de contacts

### Requirement 2: Préservation des Fonctionnalités d'Édition Inline

**User Story:** En tant qu'utilisateur, je veux pouvoir éditer toutes les cellules de la table exactement comme avant, afin de ne pas perdre mes habitudes de travail.

#### Acceptance Criteria

1. WHEN THE utilisateur clique sur une cellule de statut, THE ContactTable Component SHALL afficher le StatusSelect dropdown avec tous les statuts disponibles
2. WHEN THE utilisateur modifie un commentaire, THE ContactTable Component SHALL afficher le CommentWidget avec les commentaires rapides et sauvegarder automatiquement après 1 seconde d'inactivité
3. WHEN THE utilisateur sélectionne une date (Date Rappel, Date RDV, Date Appel), THE ContactTable Component SHALL afficher le DateTimeCell avec le calendrier Popover
4. WHEN THE utilisateur sélectionne une heure (Heure Rappel, Heure RDV, Heure Appel), THE ContactTable Component SHALL afficher le TimePickerWithClear avec les sélecteurs d'heures et minutes
5. WHEN THE utilisateur double-clique sur une cellule éditable (Prénom, Nom, Téléphone, Email, Source), THE ContactTable Component SHALL activer le mode édition inline avec un Input
6. WHEN THE utilisateur clique sur l'icône Bell dans la colonne Date Rappel, THE ContactTable Component SHALL ouvrir le ReminderDialog

### Requirement 3: Gestion Optimisée des Mises à Jour de Données

**User Story:** En tant qu'utilisateur, je veux que mes modifications soient sauvegardées rapidement sans ralentir l'interface, afin de pouvoir travailler efficacement.

#### Acceptance Criteria

1. WHEN THE utilisateur modifie une cellule, THE ContactTable Component SHALL appliquer un debounce de 300ms avant de déclencher onUpdateContact
2. WHEN THE onUpdateContact est appelé, THE ContactTable Component SHALL mettre à jour uniquement la ligne concernée sans re-render de toute la table
3. WHEN THE données de contacts changent (ajout, suppression, modification), THE ContactTable Component SHALL utiliser React.memo avec une comparaison shallow pour éviter les re-renders inutiles
4. WHEN THE utilisateur trie ou filtre la table, THE ContactTable Component SHALL recalculer les données affichées en utilisant useMemo avec les dépendances appropriées
5. WHEN THE table contient plus de 1000 contacts, THE ContactTable Component SHALL maintenir un temps de réponse inférieur à 100ms pour toute interaction utilisateur

### Requirement 4: Préservation de l'Interface Visuelle et des Composants

**User Story:** En tant qu'utilisateur, je veux que la table conserve exactement la même apparence et les mêmes composants, afin de ne pas être désorienté par les changements.

#### Acceptance Criteria

1. WHEN THE table est affichée, THE ContactTable Component SHALL utiliser les mêmes composants shadcn/ui (Table, TableHeader, TableBody, TableRow, TableCell, TableHead)
2. WHEN THE en-tête de table est visible, THE ContactTable Component SHALL maintenir le sticky header avec les mêmes styles CSS (position: sticky, backdrop-filter, box-shadow)
3. WHEN THE utilisateur survole une ligne, THE ContactTable Component SHALL appliquer les mêmes classes de hover (hover:bg-muted/50)
4. WHEN THE une ligne est sélectionnée, THE ContactTable Component SHALL appliquer les mêmes classes de sélection (bg-blue-500/20 dark:bg-blue-500/30)
5. WHEN THE un appel est actif, THE ContactTable Component SHALL appliquer les mêmes classes d'appel actif (bg-green-900/20 hover:bg-green-900/30)
6. WHEN THE table affiche les cellules, THE ContactTable Component SHALL utiliser les mêmes widgets existants (StatusSelect, CommentWidget, DateTimeCell, TimePickerWithClear)

### Requirement 5: Gestion du Tri et du Filtrage

**User Story:** En tant qu'utilisateur, je veux pouvoir trier et filtrer mes contacts rapidement, afin de trouver facilement les informations dont j'ai besoin.

#### Acceptance Criteria

1. WHEN THE utilisateur clique sur un en-tête de colonne triable, THE ContactTable Component SHALL trier les données en utilisant TanStack Table getSortedRowModel en moins de 100ms
2. WHEN THE tri est appliqué, THE ContactTable Component SHALL afficher l'indicateur de tri approprié (ArrowUp, ArrowDown, ArrowUpDown)
3. WHEN THE utilisateur change le tri, THE ContactTable Component SHALL persister la configuration de tri dans localStorage avec la clé 'dimicall-sort-config'
4. WHEN THE table est rechargée, THE ContactTable Component SHALL restaurer la configuration de tri depuis localStorage
5. WHEN THE utilisateur applique un filtre de recherche, THE ContactTable Component SHALL filtrer les données en utilisant TanStack Table getFilteredRowModel en moins de 100ms

### Requirement 6: Gestion de la Visibilité et de l'Ordre des Colonnes

**User Story:** En tant qu'utilisateur, je veux pouvoir masquer/afficher et réorganiser les colonnes comme avant, afin de personnaliser ma vue.

#### Acceptance Criteria

1. WHEN THE utilisateur toggle la visibilité d'une colonne, THE ContactTable Component SHALL utiliser TanStack Table column.toggleVisibility() et persister dans localStorage
2. WHEN THE utilisateur drag-and-drop une colonne, THE ContactTable Component SHALL réorganiser les colonnes en utilisant TanStack Table setColumnOrder()
3. WHEN THE ordre des colonnes change, THE ContactTable Component SHALL persister le nouvel ordre dans localStorage avec la clé 'dimicall-column-order'
4. WHEN THE table est rechargée, THE ContactTable Component SHALL restaurer l'ordre et la visibilité des colonnes depuis localStorage
5. WHEN THE utilisateur clique sur "Afficher toutes les colonnes", THE ContactTable Component SHALL rendre toutes les colonnes visibles via TanStack Table setColumnVisibility()

### Requirement 7: Scroll Automatique et Navigation

**User Story:** En tant qu'utilisateur, je veux que la table scroll automatiquement vers le contact sélectionné, afin de toujours voir le contact actif.

#### Acceptance Criteria

1. WHEN THE utilisateur clique sur une ligne, THE ContactTable Component SHALL scroll vers cette ligne en utilisant scrollToIndex de TanStack Virtual
2. WHEN THE scroll automatique est déclenché, THE ContactTable Component SHALL centrer la ligne dans le viewport avec un comportement smooth
3. WHEN THE contact sélectionné est déjà visible, THE ContactTable Component SHALL ne pas déclencher de scroll
4. WHEN THE utilisateur scroll manuellement, THE ContactTable Component SHALL désactiver temporairement le scroll automatique
5. WHEN THE scrollToContact est appelé via ref, THE ContactTable Component SHALL utiliser virtualizer.scrollToIndex() pour positionner la ligne

### Requirement 8: Pagination Optimisée

**User Story:** En tant qu'utilisateur, je veux que la pagination fonctionne de manière fluide avec la virtualisation, afin de naviguer efficacement dans de grandes listes.

#### Acceptance Criteria

1. WHEN THE utilisateur change de page, THE PaginatedContactTable Component SHALL mettre à jour les données affichées en moins de 100ms
2. WHEN THE page change, THE PaginatedContactTable Component SHALL réinitialiser le scroll virtuel à la position 0
3. WHEN THE utilisateur change le nombre d'éléments par page, THE PaginatedContactTable Component SHALL recalculer la virtualisation avec la nouvelle taille
4. WHEN THE pagination est active, THE ContactTable Component SHALL virtualiser uniquement les contacts de la page courante
5. WHEN THE utilisateur navigue entre les pages, THE PaginatedContactTable Component SHALL persister la page courante dans localStorage

### Requirement 9: Compatibilité avec les Fonctionnalités Existantes

**User Story:** En tant qu'utilisateur, je veux que toutes les fonctionnalités existantes continuent de fonctionner, afin de ne rien perdre dans la migration.

#### Acceptance Criteria

1. WHEN THE utilisateur utilise le drag-and-drop de fichiers, THE PaginatedContactTable Component SHALL afficher le DropZoneOverlay et ouvrir le ImportMappingDialog
2. WHEN THE utilisateur ouvre le ReminderDialog, THE ContactTable Component SHALL afficher le dialogue avec les valeurs actuelles du contact
3. WHEN THE utilisateur utilise les raccourcis clavier (F1-F10), THE ContactTable Component SHALL appliquer les actions correspondantes sur le contact sélectionné
4. WHEN THE table affiche l'état d'appel, THE ContactTable Component SHALL afficher les indicateurs visuels appropriés (classes CSS, animations)
5. WHEN THE utilisateur exporte les données, THE PaginatedContactTable Component SHALL exporter tous les contacts, pas seulement ceux de la page courante

### Requirement 10: Mesures de Performance et Monitoring

**User Story:** En tant que développeur, je veux pouvoir mesurer les performances de la table, afin de valider les optimisations et détecter les régressions.

#### Acceptance Criteria

1. WHEN THE table est en mode développement, THE ContactTable Component SHALL logger les temps de rendu dans la console avec console.time/timeEnd
2. WHEN THE virtualisation est active, THE ContactTable Component SHALL afficher le nombre de lignes rendues vs total dans les DevTools
3. WHEN THE utilisateur interagit avec la table, THE ContactTable Component SHALL maintenir un frame rate minimum de 60 FPS mesurable via React DevTools Profiler
4. WHEN THE table charge plus de 1000 contacts, THE ContactTable Component SHALL utiliser moins de 200MB de mémoire mesurable via Chrome DevTools Memory Profiler
5. WHEN THE optimisations sont appliquées, THE ContactTable Component SHALL réduire le temps de chargement initial d'au moins 80% par rapport à l'implémentation actuelle
