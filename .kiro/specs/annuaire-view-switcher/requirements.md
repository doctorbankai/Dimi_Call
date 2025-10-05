# Requirements Document

## Introduction

Cette fonctionnalité vise à enrichir la page "Annuaire" en permettant aux utilisateurs de basculer entre deux modes d'affichage : une vue en cards (actuelle) et une vue en table (similaire à celle de la page "Données"). L'objectif est d'offrir plus de flexibilité dans la visualisation des contacts tout en maintenant une expérience utilisateur fluide et cohérente.

## Requirements

### Requirement 1: Ajout d'un sélecteur de vue

**User Story:** En tant qu'utilisateur, je veux pouvoir choisir entre une vue en cards et une vue en table dans la page Annuaire, afin de visualiser mes contacts selon mes préférences.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la page Annuaire THEN un contrôle de sélection de vue SHALL être visible dans la barre de navigation/toolbar
2. WHEN l'utilisateur clique sur le sélecteur de vue THEN les options "Cards" et "Table" SHALL être affichées
3. WHEN l'utilisateur sélectionne une option THEN la vue correspondante SHALL s'afficher immédiatement
4. WHEN l'utilisateur change de vue THEN la préférence SHALL être sauvegardée dans le localStorage
5. WHEN l'utilisateur revient sur la page Annuaire THEN la dernière vue sélectionnée SHALL être restaurée automatiquement

### Requirement 2: Implémentation de la vue Table

**User Story:** En tant qu'utilisateur, je veux voir mes contacts dans une vue table similaire à celle de la page "Données", afin d'avoir une vue plus compacte et tabulaire de l'information.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne la vue "Table" THEN une table SHALL afficher les contacts avec les colonnes suivantes : Sélection, #, Prénom, Nom, Téléphone, Email, Statut, Commentaire, Date Rappel, Heure Rappel, Date RDV, Heure RDV, Date Appel, Heure Appel, Durée Appel
2. WHEN la vue table est affichée THEN les données SHALL correspondre exactement aux contacts affichés dans la vue cards
3. WHEN l'utilisateur clique sur un en-tête de colonne THEN les données SHALL être triées selon cette colonne
4. WHEN l'utilisateur double-clique sur une cellule éditable THEN il SHALL pouvoir modifier la valeur directement dans la table
5. WHEN l'utilisateur sélectionne des lignes via les checkboxes THEN les actions de sélection multiple SHALL être disponibles (suppression, transfert, etc.)
6. WHEN la table est affichée THEN elle SHALL utiliser le même système de pagination que la page "Données"

### Requirement 3: Transition fluide entre les vues

**User Story:** En tant qu'utilisateur, je veux que le changement entre les vues soit instantané et sans perte de contexte, afin de maintenir ma productivité.

#### Acceptance Criteria

1. WHEN l'utilisateur change de vue THEN la transition SHALL être instantanée (< 100ms)
2. WHEN l'utilisateur change de vue THEN les filtres actifs (recherche, date range) SHALL être préservés
3. WHEN l'utilisateur change de vue THEN la sélection de contacts SHALL être préservée
4. WHEN l'utilisateur change de vue THEN la position de scroll SHALL être réinitialisée au début
5. WHEN l'utilisateur change de vue THEN aucun rechargement de données depuis la base de données SHALL être nécessaire

### Requirement 4: Cohérence des fonctionnalités entre les vues

**User Story:** En tant qu'utilisateur, je veux que toutes les fonctionnalités disponibles dans la vue cards soient également disponibles dans la vue table, afin de ne pas perdre de fonctionnalités en changeant de vue.

#### Acceptance Criteria

1. WHEN l'utilisateur est en vue table THEN les actions de sélection multiple (suppression, transfert, partage Supabase) SHALL être disponibles
2. WHEN l'utilisateur est en vue table THEN les filtres de recherche et de date SHALL fonctionner de manière identique à la vue cards
3. WHEN l'utilisateur est en vue table THEN le tri des données SHALL être disponible
4. WHEN l'utilisateur est en vue table THEN les actions d'export (CSV, Excel) SHALL être disponibles
5. WHEN l'utilisateur est en vue table THEN les actions d'import (CSV, Excel) SHALL être disponibles
6. WHEN l'utilisateur est en vue table THEN le bouton de rafraîchissement SHALL être disponible

### Requirement 5: Responsive design et accessibilité

**User Story:** En tant qu'utilisateur, je veux que le sélecteur de vue et les deux modes d'affichage soient utilisables sur différentes tailles d'écran, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la page sur un écran de petite taille THEN le sélecteur de vue SHALL rester visible et accessible
2. WHEN la vue table est affichée sur un écran de petite taille THEN un scroll horizontal SHALL être disponible pour voir toutes les colonnes
3. WHEN l'utilisateur utilise le clavier THEN il SHALL pouvoir naviguer entre les vues avec les touches Tab et Enter
4. WHEN l'utilisateur utilise un lecteur d'écran THEN les labels appropriés SHALL être annoncés pour le sélecteur de vue
5. WHEN l'utilisateur change de vue THEN un feedback visuel subtil SHALL indiquer le changement (pas de notification intrusive)
