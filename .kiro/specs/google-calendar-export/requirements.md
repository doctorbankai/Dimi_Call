# Requirements Document

## Introduction

Cette fonctionnalité permet d'exporter les rappels de contacts vers Google Agenda (Google Calendar) sous forme de fichier CSV. L'objectif est de créer un bouton "Agenda" à côté du bouton "Contacts" existant, qui génère un fichier CSV compatible avec l'importation Google Calendar contenant tous les rappels programmés des contacts.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir exporter mes rappels de contacts vers Google Agenda, afin de synchroniser mes tâches de rappel avec mon calendrier personnel.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à l'interface principale THEN le système SHALL afficher un bouton "Agenda" à côté du bouton "Contacts" existant dans la barre d'outils
2. WHEN l'utilisateur survole le bouton "Agenda" THEN le système SHALL afficher un tooltip indiquant le nombre de rappels à exporter vers Google Agenda
3. WHEN l'utilisateur clique sur le bouton "Agenda" THEN le système SHALL générer et télécharger un fichier CSV au format Google Calendar
4. WHEN aucun contact n'a de date/heure de rappel définie THEN le système SHALL désactiver le bouton et afficher un message informatif

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que le fichier CSV exporté soit compatible avec Google Calendar, afin de pouvoir l'importer directement sans modification.

#### Acceptance Criteria

1. WHEN le système génère le fichier CSV THEN le système SHALL utiliser les en-têtes obligatoires Google Calendar : "Subject", "Start Date", "Start Time"
2. WHEN le système génère le fichier CSV THEN le système SHALL inclure les en-têtes optionnels : "End Date", "End Time", "Description", "All Day Event", "Private"
3. WHEN le système génère le fichier CSV THEN le système SHALL formater les dates au format MM/DD/YYYY
4. WHEN le système génère le fichier CSV THEN le système SHALL formater les heures au format HH:MM AM/PM
5. WHEN le système génère le fichier CSV THEN le système SHALL encoder le fichier en UTF-8 avec BOM pour la compatibilité

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que chaque rappel soit transformé en événement calendrier avec les informations pertinentes du contact, afin de pouvoir identifier facilement qui rappeler.

#### Acceptance Criteria

1. WHEN le système crée un événement de rappel THEN le système SHALL utiliser comme titre "Rappel: [Prénom] [Nom]"
2. WHEN le système crée un événement de rappel THEN le système SHALL utiliser la date de rappel comme date de début
3. WHEN le système crée un événement de rappel THEN le système SHALL utiliser l'heure de rappel comme heure de début
4. WHEN le système crée un événement de rappel THEN le système SHALL définir une durée par défaut de 30 minutes
5. WHEN le système crée un événement de rappel THEN le système SHALL inclure dans la description : téléphone, email, statut, commentaire et source du contact
6. WHEN le contact n'a pas d'heure de rappel définie mais a une date THEN le système SHALL créer un événement "toute la journée"

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux recevoir des notifications appropriées lors de l'export, afin de connaître le résultat de l'opération.

#### Acceptance Criteria

1. WHEN l'export se déroule avec succès THEN le système SHALL afficher une notification de succès indiquant le nombre de rappels exportés
2. WHEN aucun rappel n'est disponible pour l'export THEN le système SHALL afficher une notification d'avertissement
3. WHEN une erreur survient pendant l'export THEN le système SHALL afficher une notification d'erreur avec un message explicatif
4. WHEN le fichier est généré THEN le système SHALL utiliser un nom de fichier au format "google-calendar-export-YYYY-MM-DD-HH-MM-SS.csv"

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que le bouton "Agenda" ait la même apparence et le même comportement que le bouton "Contacts", afin d'avoir une interface cohérente.

#### Acceptance Criteria

1. WHEN le bouton "Agenda" est affiché THEN le système SHALL utiliser le même style CSS que le bouton "Contacts"
2. WHEN le bouton "Agenda" est affiché THEN le système SHALL afficher une icône de calendrier appropriée
3. WHEN le bouton "Agenda" est affiché THEN le système SHALL afficher un badge avec le nombre de rappels disponibles
4. WHEN le bouton "Agenda" est survolé THEN le système SHALL appliquer les mêmes effets visuels que le bouton "Contacts"
5. WHEN aucun rappel n'est disponible THEN le système SHALL désactiver visuellement le bouton avec la même logique que le bouton "Contacts"