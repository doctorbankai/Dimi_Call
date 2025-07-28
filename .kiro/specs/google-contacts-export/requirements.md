# Requirements Document

## Introduction

Cette fonctionnalité permet d'exporter les contacts avec des statuts spécifiques ("À rappeler", "DO", "RO") vers un fichier CSV compatible avec l'importation Google Contacts. L'objectif est de faciliter la synchronisation des contacts qualifiés avec Google Contacts pour une utilisation dans d'autres outils ou pour la sauvegarde.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de l'application, je veux pouvoir exporter mes contacts avec les statuts "À rappeler", "DO", et "RO" vers un format CSV compatible Google Contacts, afin de pouvoir les importer facilement dans Google Contacts.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le bouton "Export Google Contacts" THEN le système SHALL filtrer automatiquement les contacts ayant les statuts "À rappeler", "DO", ou "RO"
2. WHEN le filtrage est effectué THEN le système SHALL générer un fichier CSV avec les colonnes requises par Google Contacts
3. WHEN le fichier CSV est généré THEN le système SHALL inclure les champs : Given Name, Family Name, Phone 1 - Value, E-mail 1 - Value, Notes
4. WHEN le fichier est téléchargé THEN le nom du fichier SHALL suivre le format "google-contacts-export-YYYY-MM-DD-HH-MM-SS.csv"

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que le bouton d'export soit facilement accessible dans l'interface principale, afin de pouvoir exporter rapidement mes contacts qualifiés.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à l'interface principale THEN le système SHALL afficher un bouton "Export Google Contacts" dans la barre d'outils
2. WHEN l'utilisateur survole le bouton THEN le système SHALL afficher un tooltip indiquant "Exporter les contacts (À rappeler, DO, RO) vers Google Contacts"
3. WHEN aucun contact ne correspond aux critères de filtrage THEN le système SHALL désactiver le bouton et afficher un message informatif

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux recevoir une confirmation du nombre de contacts exportés, afin de vérifier que l'export s'est bien déroulé.

#### Acceptance Criteria

1. WHEN l'export est initié THEN le système SHALL compter le nombre de contacts correspondant aux critères
2. WHEN l'export est terminé THEN le système SHALL afficher une notification indiquant "X contacts exportés vers Google Contacts"
3. IF aucun contact ne correspond aux critères THEN le système SHALL afficher le message "Aucun contact à exporter avec les statuts sélectionnés"

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que les données exportées soient correctement formatées pour Google Contacts, afin d'éviter les erreurs d'importation.

#### Acceptance Criteria

1. WHEN les numéros de téléphone sont exportés THEN le système SHALL conserver le formatage existant des numéros
2. WHEN les noms sont exportés THEN le système SHALL séparer correctement le prénom (Given Name) et le nom (Family Name)
3. WHEN les commentaires sont exportés THEN le système SHALL les placer dans le champ Notes de Google Contacts
4. WHEN des champs sont vides THEN le système SHALL exporter des chaînes vides plutôt que des valeurs null
5. WHEN le fichier CSV est généré THEN le système SHALL utiliser l'encodage UTF-8 avec BOM pour la compatibilité avec Google Contacts