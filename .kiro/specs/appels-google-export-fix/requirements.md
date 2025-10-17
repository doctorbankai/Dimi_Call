# Requirements Document

## Introduction

Ce document définit les exigences pour corriger le problème des options d'export Google (Contacts Google et Agenda Google) qui sont désactivées de manière permanente dans la page "Appels". Actuellement, ces options sont codées en dur avec `disabled={true}`, alors qu'elles devraient être activées dynamiquement en fonction du nombre de contacts éligibles, comme c'est le cas dans la page principale (App.tsx).

## Glossary

- **AppelsCardsView**: Composant React qui affiche la vue des appels avec les cartes de contacts
- **Export Menu**: Menu déroulant permettant de sélectionner les options d'export (CSV, Excel, Contacts Google, Agenda Google)
- **Google Contacts Export**: Fonctionnalité d'export des contacts vers Google Contacts (format vCard)
- **Google Calendar Export**: Fonctionnalité d'export des rappels vers Google Agenda (format iCalendar)
- **Contact Status**: Statut d'un contact (À rappeler, DO, RO, A0, etc.)
- **Eligible Contact**: Contact qui répond aux critères pour être exporté vers Google Contacts ou Google Agenda

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de la page "Appels", je veux pouvoir exporter mes contacts vers Google Contacts, afin de synchroniser mes contacts éligibles avec mon compte Google.

#### Acceptance Criteria

1. WHEN THE AppelsCardsView SHALL display the Export Menu, THE AppelsCardsView SHALL calculate the count of contacts eligible for Google Contacts export
2. WHILE a contact has a status of "À rappeler", "DO", "RO", or "A0", THE AppelsCardsView SHALL include this contact in the Google Contacts export count
3. WHEN the Google Contacts export count is greater than zero, THE AppelsCardsView SHALL enable the "Contacts Google" menu option
4. WHEN the Google Contacts export count is zero, THE AppelsCardsView SHALL disable the "Contacts Google" menu option
5. WHEN the Google Contacts export count is greater than zero, THE AppelsCardsView SHALL display the count next to the "Contacts Google" menu option

### Requirement 2

**User Story:** En tant qu'utilisateur de la page "Appels", je veux pouvoir exporter mes rappels vers Google Agenda, afin de synchroniser mes rappels avec mon calendrier Google.

#### Acceptance Criteria

1. WHEN THE AppelsCardsView SHALL display the Export Menu, THE AppelsCardsView SHALL calculate the count of contacts with valid reminder dates
2. WHILE a contact has a non-empty dateRappel field, THE AppelsCardsView SHALL include this contact in the Google Calendar export count
3. WHEN the Google Calendar export count is greater than zero, THE AppelsCardsView SHALL enable the "Agenda Google" menu option
4. WHEN the Google Calendar export count is zero, THE AppelsCardsView SHALL disable the "Agenda Google" menu option
5. WHEN the Google Calendar export count is greater than zero, THE AppelsCardsView SHALL display the count next to the "Agenda Google" menu option

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le comportement des options d'export soit cohérent entre la page principale et la page "Appels", afin d'avoir une expérience utilisateur uniforme.

#### Acceptance Criteria

1. THE AppelsCardsView SHALL use the same logic for calculating Google Contacts export count as the main App component
2. THE AppelsCardsView SHALL use the same logic for calculating Google Calendar export count as the main App component
3. THE AppelsCardsView SHALL use the same filtering criteria for eligible contacts as the main App component
4. THE AppelsCardsView SHALL display the export counts in the same format as the main App component
5. THE AppelsCardsView SHALL update the export counts reactively when the contacts list changes
