# Requirements Document

## Introduction

Cette fonctionnalité vise à enrichir la page "Appels 2" en ajoutant un sélecteur de vue (Cards/Table) identique à celui de la page "Annuaire". L'objectif est d'offrir aux utilisateurs la même flexibilité de visualisation dans la page Appels 2, en réutilisant exactement les mêmes composants et patterns d'interface que ceux déjà implémentés dans la page Annuaire.

## Requirements

### Requirement 1: Ajout du ViewSwitcher dans la navbar

**User Story:** En tant qu'utilisateur, je veux voir le même sélecteur de vue Cards/Table dans la page Appels 2 que celui présent dans la page Annuaire, afin d'avoir une expérience cohérente à travers l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la page Appels 2 THEN un contrôle ViewSwitcher SHALL être visible dans la navbar, à côté des autres boutons (Autocall, Import, Export, Supprimer)
2. WHEN l'utilisateur clique sur le bouton "Cards" THEN la vue en cards SHALL s'afficher
3. WHEN l'utilisateur clique sur le bouton "Table" THEN la vue en table SHALL s'afficher
4. WHEN l'utilisateur change de vue THEN la préférence SHALL être sauvegardée dans le localStorage avec la clé 'appels-2-view-mode'
5. WHEN l'utilisateur revient sur la page Appels 2 THEN la dernière vue sélectionnée SHALL être restaurée automatiquement

### Requirement 2: Implémentation de la vue Table

**User Story:** En tant qu'utilisateur, je veux voir mes contacts dans une vue table identique à celle de la page Annuaire, afin d'avoir une vue plus compacte et tabulaire de l'information.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne la vue "Table" THEN une table SHALL afficher tous les éléments actuellement visibles dans la vue cards
2. WHEN la vue table est affichée THEN elle SHALL utiliser exactement le même composant AnnuaireTable que la page Annuaire
3. WHEN la vue table est affichée THEN toutes les colonnes pertinentes SHALL être visibles (Sélection, #, Prénom, Nom, Téléphone, Email, Statut, Commentaire, Date Rappel, Heure Rappel, Date RDV, Heure RDV, Date Appel, Heure Appel, Durée Appel)
4. WHEN l'utilisateur clique sur un en-tête de colonne THEN les données SHALL être triées selon cette colonne
5. WHEN l'utilisateur double-clique sur une cellule éditable THEN il SHALL pouvoir modifier la valeur directement dans la table
6. WHEN l'utilisateur sélectionne des lignes via les checkboxes THEN les mêmes actions de sélection multiple SHALL être disponibles

### Requirement 3: Réutilisation exacte des composants existants

**User Story:** En tant que développeur, je veux réutiliser exactement les mêmes composants (ViewSwitcher, AnnuaireTable) que ceux de la page Annuaire, afin de maintenir la cohérence et éviter la duplication de code.

#### Acceptance Criteria

1. WHEN le ViewSwitcher est ajouté THEN il SHALL utiliser le composant src/components/ViewSwitcher.tsx sans modification
2. WHEN la vue table est implémentée THEN elle SHALL utiliser le composant src/components/AnnuaireTable.tsx sans modification
3. WHEN les données sont passées au AnnuaireTable THEN elles SHALL être dans le format DirectoryContact attendu par le composant
4. WHEN l'utilisateur interagit avec la table THEN tous les callbacks (onToggleSelection, onToggleSelectAll, onContactClick) SHALL fonctionner correctement
5. WHEN la page est affichée THEN le style et le comportement SHALL être identiques à ceux de la page Annuaire

### Requirement 4: Préservation du contexte lors du changement de vue

**User Story:** En tant qu'utilisateur, je veux que le changement entre les vues soit instantané et sans perte de contexte, afin de maintenir ma productivité.

#### Acceptance Criteria

1. WHEN l'utilisateur change de vue THEN la transition SHALL être instantanée (< 100ms)
2. WHEN l'utilisateur change de vue THEN les filtres actifs (tabs LinkedIn/Google/Lien, recherche) SHALL être préservés
3. WHEN l'utilisateur change de vue THEN la sélection de contacts SHALL être préservée
4. WHEN l'utilisateur change de vue THEN la position de scroll SHALL être réinitialisée au début
5. WHEN l'utilisateur change de vue THEN aucun rechargement de données depuis la base de données SHALL être nécessaire

### Requirement 5: Cohérence des fonctionnalités entre les vues

**User Story:** En tant qu'utilisateur, je veux que toutes les fonctionnalités disponibles dans la vue cards soient également disponibles dans la vue table, afin de ne pas perdre de fonctionnalités en changeant de vue.

#### Acceptance Criteria

1. WHEN l'utilisateur est en vue table THEN les actions de sélection multiple (suppression) SHALL être disponibles
2. WHEN l'utilisateur est en vue table THEN les filtres de tabs (Désactivé, LinkedIn, Google, Lien) SHALL fonctionner de manière identique à la vue cards
3. WHEN l'utilisateur est en vue table THEN le tri des données SHALL être disponible
4. WHEN l'utilisateur est en vue table THEN les actions d'export (CSV, Excel) SHALL être disponibles
5. WHEN l'utilisateur est en vue table THEN les actions d'import (CSV, Excel) SHALL être disponibles
6. WHEN l'utilisateur est en vue table THEN le bouton Autocall SHALL être disponible et fonctionnel

### Requirement 6: Positionnement exact du ViewSwitcher dans la navbar

**User Story:** En tant qu'utilisateur, je veux que le ViewSwitcher soit positionné de manière logique et cohérente dans la navbar, afin de le trouver facilement.

#### Acceptance Criteria

1. WHEN la navbar est affichée THEN le ViewSwitcher SHALL être positionné entre les tabs (Désactivé/LinkedIn/Google/Lien) et le bouton Autocall
2. WHEN la navbar est affichée sur mobile THEN le ViewSwitcher SHALL rester visible et accessible
3. WHEN la navbar est affichée THEN le ViewSwitcher SHALL utiliser les mêmes styles que celui de la page Annuaire
4. WHEN l'utilisateur survole le ViewSwitcher THEN les mêmes effets hover SHALL être visibles
5. WHEN l'utilisateur utilise le clavier THEN il SHALL pouvoir naviguer vers le ViewSwitcher avec Tab et l'activer avec Enter

### Requirement 7: Responsive design et accessibilité

**User Story:** En tant qu'utilisateur, je veux que le sélecteur de vue et les deux modes d'affichage soient utilisables sur différentes tailles d'écran, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la page sur un écran de petite taille THEN le sélecteur de vue SHALL rester visible et accessible
2. WHEN la vue table est affichée sur un écran de petite taille THEN un scroll horizontal SHALL être disponible pour voir toutes les colonnes
3. WHEN l'utilisateur utilise le clavier THEN il SHALL pouvoir naviguer entre les vues avec les touches Tab et Enter
4. WHEN l'utilisateur utilise un lecteur d'écran THEN les labels appropriés SHALL être annoncés pour le sélecteur de vue
5. WHEN l'utilisateur change de vue THEN un feedback visuel subtil SHALL indiquer le changement (pas de notification intrusive)
