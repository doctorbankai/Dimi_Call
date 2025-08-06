# Requirements Document

## Introduction

Cette fonctionnalité vise à corriger plusieurs problèmes d'interface utilisateur liés au mode sombre et à améliorer l'expérience utilisateur avec des ajustements spécifiques aux sélecteurs de date/heure, aux unités de temps et aux statuts de contact.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur utilisant le mode sombre, je veux que les icônes dans les sélecteurs de date et d'heure soient visibles, afin de pouvoir utiliser ces contrôles efficacement.

#### Acceptance Criteria

1. WHEN l'utilisateur est en mode sombre THEN les icônes des inputs de type "date" SHALL être visibles avec un contraste suffisant
2. WHEN l'utilisateur est en mode sombre THEN les icônes des inputs de type "time" SHALL être visibles avec un contraste suffisant
3. WHEN l'utilisateur survole les sélecteurs de date/heure en mode sombre THEN les icônes SHALL maintenir leur visibilité
4. WHEN l'utilisateur clique sur les sélecteurs de date/heure en mode sombre THEN les icônes SHALL rester visibles pendant l'interaction

### Requirement 2

**User Story:** En tant qu'utilisateur français, je veux voir "an(s)" au lieu de "année(s)" dans le sélecteur d'unité de temps, afin d'avoir une interface plus concise et naturelle.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre le sélecteur d'unité de temps THEN l'option SHALL afficher "an(s)" au lieu de "année(s)"
2. WHEN l'utilisateur sélectionne l'unité "an(s)" THEN le calcul de date SHALL fonctionner correctement avec les années
3. WHEN l'utilisateur voit le texte de prévisualisation THEN il SHALL utiliser "an(s)" dans la description

### Requirement 3

**User Story:** En tant qu'utilisateur gérant des contacts, je veux avoir un nouveau statut "A0" avec une couleur distincte, afin de pouvoir catégoriser mes contacts avec plus de précision.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre le sélecteur de statut THEN l'option "A0" SHALL être disponible dans la liste
2. WHEN l'utilisateur sélectionne le statut "A0" THEN il SHALL avoir une couleur de fond distincte des autres statuts
3. WHEN l'utilisateur est en mode sombre THEN le statut "A0" SHALL avoir des couleurs appropriées pour le mode sombre
4. WHEN l'utilisateur filtre par statut THEN le statut "A0" SHALL être inclus dans les options de filtrage
5. WHEN l'utilisateur exporte des données THEN le statut "A0" SHALL être correctement inclus dans l'export

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que le sélecteur d'heure personnalisé soit utilisé de manière cohérente, afin d'avoir une expérience utilisateur uniforme dans toute l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur interagit avec un sélecteur d'heure THEN il SHALL utiliser le widget de sélection personnalisé avec heures et minutes
2. WHEN l'utilisateur sélectionne une heure THEN la valeur SHALL être correctement formatée en HH:mm
3. WHEN l'utilisateur est en mode sombre THEN le sélecteur d'heure personnalisé SHALL avoir un style approprié
4. WHEN l'utilisateur utilise un appareil tactile THEN le sélecteur d'heure SHALL être facilement utilisable