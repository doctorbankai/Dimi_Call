# Requirements Document

## Introduction

Cette fonctionnalité ajoute un nouveau graphique en forme de pie chart (camembert) sur la page "Graphiques" qui présente les statuts des contacts selon une logique d'entonnoir de conversion. Le graphique permettra de visualiser la progression des contacts à travers différentes étapes : Contacté, Décroché, Argumenté, et Pris.

Le graphique doit agréger les statuts existants selon des règles métier spécifiques qui reflètent le parcours client, en utilisant les données de la base locale (status_events) et en respectant les filtres de dates déjà en place sur la page.

## Requirements

### Requirement 1: Agrégation des statuts en catégories d'entonnoir

**User Story:** En tant qu'utilisateur de l'application, je veux voir un graphique qui regroupe les statuts en catégories d'entonnoir (Contacté, Décroché, Argumenté, Pris), afin de mieux comprendre la progression de mes contacts dans le processus de conversion.

#### Acceptance Criteria

1. WHEN le composant charge les événements de statut THEN le système SHALL calculer quatre catégories d'entonnoir basées sur les statuts individuels
2. WHEN un contact a le statut "Mauvais num", "Répondeur", "À rappeler", "Pas intéressé", "Argumenté", "D0" ou "R0" THEN le système SHALL l'inclure dans la catégorie "Contacté"
3. WHEN un contact a le statut "À rappeler", "Pas intéressé", "Argumenté", "D0" ou "R0" THEN le système SHALL l'inclure dans la catégorie "Décroché"
4. WHEN un contact a le statut "Argumenté", "D0" ou "R0" THEN le système SHALL l'inclure dans la catégorie "Argumenté"
5. WHEN un contact a le statut "D0" ou "R0" THEN le système SHALL l'inclure dans la catégorie "Pris"
6. WHEN le système agrège les statuts THEN il SHALL compter chaque événement de statut dans toutes les catégories applicables (un même événement peut contribuer à plusieurs catégories)

### Requirement 2: Affichage du graphique en pie chart

**User Story:** En tant qu'utilisateur, je veux voir les données d'entonnoir présentées sous forme de pie chart (camembert), afin de visualiser rapidement les proportions de chaque étape du processus.

#### Acceptance Criteria

1. WHEN le composant affiche le graphique THEN il SHALL utiliser un PieChart de Recharts avec les composants shadcn/ui
2. WHEN le graphique est rendu THEN il SHALL afficher quatre segments correspondant aux catégories "Contacté", "Décroché", "Argumenté" et "Pris"
3. WHEN l'utilisateur survole un segment THEN le système SHALL afficher un tooltip avec le nom de la catégorie et le nombre d'événements
4. WHEN le graphique est affiché THEN il SHALL utiliser des couleurs distinctes pour chaque segment (utilisant les variables CSS --chart-1 à --chart-4)
5. WHEN le graphique est rendu THEN il SHALL inclure une légende affichant les catégories avec leurs couleurs respectives
6. WHEN le graphique est affiché THEN il SHALL avoir une hauteur responsive adaptée aux différentes tailles d'écran

### Requirement 3: Intégration avec les filtres de dates existants

**User Story:** En tant qu'utilisateur, je veux que le nouveau graphique d'entonnoir respecte les filtres de dates que j'applique, afin d'analyser les performances sur des périodes spécifiques.

#### Acceptance Criteria

1. WHEN l'utilisateur applique un filtre de dates via l'événement 'dimicall-date-filter' avec scope 'graph' THEN le graphique d'entonnoir SHALL se mettre à jour avec les données filtrées
2. WHEN aucun filtre de dates n'est appliqué THEN le graphique SHALL afficher toutes les données disponibles dans la base locale
3. WHEN les données sont filtrées par dates THEN le système SHALL utiliser les mêmes événements locaux (localEvents) que les autres graphiques de la page
4. WHEN les filtres changent THEN le graphique SHALL se recalculer automatiquement via les hooks React appropriés

### Requirement 4: Positionnement et mise en page

**User Story:** En tant qu'utilisateur, je veux que le nouveau graphique soit bien intégré visuellement dans la page Graphiques, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. WHEN la page Graphiques est affichée THEN le nouveau graphique d'entonnoir SHALL être positionné après le graphique "Répartition des statuts" existant
2. WHEN le graphique est rendu THEN il SHALL utiliser le même style de Card que les autres graphiques (shadcn/ui Card component)
3. WHEN le graphique est affiché THEN il SHALL avoir un titre "Entonnoir de conversion" et une description "Progression des contacts par étape"
4. WHEN le graphique est rendu THEN il SHALL occuper toute la largeur disponible (w-full) comme les autres graphiques
5. WHEN le graphique est affiché THEN il SHALL afficher le nombre total d'événements analysés en dessous du graphique

### Requirement 5: Gestion des cas limites

**User Story:** En tant qu'utilisateur, je veux que le graphique gère correctement les situations où il n'y a pas de données, afin d'éviter les erreurs et d'avoir un retour clair.

#### Acceptance Criteria

1. WHEN aucun événement n'est disponible dans localEvents THEN le graphique SHALL afficher un message "Aucune donnée disponible"
2. WHEN une catégorie d'entonnoir a une valeur de 0 THEN elle SHALL quand même apparaître dans le graphique avec une valeur de 0
3. WHEN les données sont en cours de chargement THEN le graphique SHALL afficher l'état de chargement de manière cohérente avec les autres composants
4. WHEN un statut dans les événements ne correspond à aucune catégorie connue THEN il SHALL être ignoré silencieusement sans provoquer d'erreur
