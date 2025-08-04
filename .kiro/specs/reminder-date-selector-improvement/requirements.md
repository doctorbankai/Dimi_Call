# Requirements Document

## Introduction

Cette fonctionnalité améliore l'interface de programmation de rappels en ajoutant des sélecteurs de date plus intuitifs et conviviaux. Actuellement, les utilisateurs doivent saisir manuellement une date et une heure dans des champs séparés. Cette amélioration ajoute une option de sélection rapide permettant de choisir une date relative (dans X jours/semaines/mois/années) qui se calcule automatiquement par rapport à la date actuelle.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir sélectionner rapidement une date de rappel en utilisant des intervalles relatifs (dans X jours/semaines/mois/années), afin de programmer plus facilement mes rappels sans avoir à calculer manuellement les dates futures.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre le dialog de programmation de rappel THEN le système SHALL afficher les champs de date/heure existants ET les nouveaux sélecteurs relatifs
2. WHEN l'utilisateur saisit un nombre dans le champ quantité THEN le système SHALL accepter uniquement des nombres entiers positifs
3. WHEN l'utilisateur sélectionne une unité de temps (jour(s), semaine(s), mois, année(s)) THEN le système SHALL calculer automatiquement la date correspondante
4. WHEN l'utilisateur modifie la quantité ou l'unité THEN le système SHALL mettre à jour automatiquement le champ date principal
5. WHEN la date calculée est valide THEN le système SHALL synchroniser le champ date principal avec la date calculée

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que les sélecteurs relatifs soient intuitifs et accessibles, afin de pouvoir les utiliser facilement sur différents appareils et configurations.

#### Acceptance Criteria

1. WHEN l'utilisateur interagit avec les sélecteurs THEN le système SHALL maintenir la cohérence visuelle avec le design existant
2. WHEN l'utilisateur utilise le clavier THEN le système SHALL permettre la navigation entre les champs avec Tab
3. WHEN l'utilisateur saisit des valeurs invalides THEN le système SHALL afficher des messages d'erreur clairs
4. WHEN l'utilisateur utilise un lecteur d'écran THEN le système SHALL fournir des labels appropriés pour l'accessibilité
5. WHEN l'utilisateur est sur mobile THEN le système SHALL adapter l'interface pour une utilisation tactile optimale

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que les deux méthodes de sélection de date (manuelle et relative) fonctionnent ensemble de manière cohérente, afin de pouvoir basculer entre elles sans perdre mes données.

#### Acceptance Criteria

1. WHEN l'utilisateur modifie le champ date manuel THEN le système SHALL réinitialiser les sélecteurs relatifs
2. WHEN l'utilisateur utilise les sélecteurs relatifs THEN le système SHALL mettre à jour le champ date manuel correspondant
3. WHEN l'utilisateur sauvegarde le rappel THEN le système SHALL utiliser la date finale calculée indépendamment de la méthode de sélection
4. WHEN l'utilisateur annule le dialog THEN le système SHALL réinitialiser tous les champs à leur état initial
5. WHEN une date calculée dépasse les limites acceptables THEN le système SHALL afficher un avertissement approprié

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que les unités de temps soient localisées en français et grammaticalement correctes, afin d'avoir une expérience utilisateur naturelle dans ma langue.

#### Acceptance Criteria

1. WHEN l'utilisateur voit les options d'unités THEN le système SHALL afficher "jour(s)", "semaine(s)", "mois", "année(s)"
2. WHEN l'utilisateur sélectionne une quantité de 1 THEN le système SHALL utiliser la forme singulière appropriée
3. WHEN l'utilisateur sélectionne une quantité supérieure à 1 THEN le système SHALL utiliser la forme plurielle appropriée
4. WHEN l'utilisateur voit le texte de prévisualisation THEN le système SHALL afficher "Dans [X] [unité]" de manière grammaticalement correcte
5. WHEN l'utilisateur interagit avec l'interface THEN tous les textes SHALL être cohérents avec la localisation française existante