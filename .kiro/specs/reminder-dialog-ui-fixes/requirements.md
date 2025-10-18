# Requirements Document

## Introduction

Ce document définit les exigences pour corriger les problèmes d'interface utilisateur dans le dialogue "Programmer un rappel". Les problèmes identifiés incluent des composants dropdown qui s'affichent derrière le dialogue principal et l'utilisation d'un input date natif au lieu du calendrier shadcn.

## Glossary

- **ReminderDialog**: Le dialogue modal permettant de programmer un rappel pour un contact
- **SelectContent**: Le composant dropdown de sélection d'unité de temps (jours, heures, etc.)
- **SingleDayPicker**: Le composant calendrier shadcn pour sélectionner une date
- **TimePicker**: Le composant dropdown pour sélectionner une heure
- **z-index**: Propriété CSS définissant l'ordre d'empilement des éléments sur l'axe Z
- **Portal**: Technique React pour rendre un composant en dehors de sa hiérarchie DOM parente

## Requirements

### Requirement 1: Correction du z-index du SelectContent

**User Story:** En tant qu'utilisateur, je veux pouvoir sélectionner l'unité de temps (jours, heures, etc.) dans le dialogue de rappel, afin de calculer rapidement une date future.

#### Acceptance Criteria

1. WHEN THE User clicks on the unit selector in the RelativeDateSelector, THE ReminderDialog SHALL display the SelectContent dropdown above all other dialog elements
2. WHEN THE SelectContent is open, THE ReminderDialog SHALL ensure the dropdown is fully visible and accessible
3. WHEN THE User interacts with the SelectContent, THE ReminderDialog SHALL maintain proper z-index hierarchy with a value greater than 20000
4. WHEN THE SelectContent is rendered, THE ReminderDialog SHALL use the portal container to ensure proper positioning within the dialog
5. WHEN THE User closes the SelectContent, THE ReminderDialog SHALL restore normal dialog interaction

### Requirement 2: Remplacement de l'input date natif par le calendrier shadcn

**User Story:** En tant qu'utilisateur, je veux utiliser un calendrier shadcn moderne pour sélectionner la date de rappel, afin d'avoir une expérience utilisateur cohérente et intuitive.

#### Acceptance Criteria

1. WHEN THE ReminderDialog is displayed, THE System SHALL show only the SingleDayPicker component for date selection
2. WHEN THE User clicks on the date field, THE System SHALL open the shadcn calendar popup
3. WHEN THE User selects a date in the calendar, THE System SHALL update the selected date and close the calendar
4. WHEN THE calendar is open, THE System SHALL display it with proper z-index above the dialog (greater than 20000)
5. WHEN THE User clears the date, THE System SHALL reset the date field to empty state

### Requirement 3: Vérification et ajustement du TimePicker

**User Story:** En tant qu'utilisateur, je veux sélectionner une heure de rappel via un dropdown moderne, afin de définir précisément le moment du rappel.

#### Acceptance Criteria

1. WHEN THE User clicks on the time field, THE System SHALL display the TimePicker dropdown with hours and minutes columns
2. WHEN THE TimePicker dropdown is open, THE System SHALL ensure it appears above the dialog with proper z-index (greater than 20000)
3. WHEN THE User selects an hour or minute, THE System SHALL update the time value immediately
4. WHEN THE TimePicker is rendered, THE System SHALL use the portal container for proper positioning
5. WHEN THE User closes the TimePicker, THE System SHALL maintain the selected time value

### Requirement 4: Cohérence visuelle et accessibilité

**User Story:** En tant qu'utilisateur, je veux que tous les composants du dialogue de rappel aient un style cohérent et soient accessibles, afin d'avoir une expérience utilisateur professionnelle.

#### Acceptance Criteria

1. WHEN THE ReminderDialog is displayed, THE System SHALL apply consistent styling to all dropdown components
2. WHEN THE User navigates with keyboard, THE System SHALL ensure all interactive elements are accessible via tab navigation
3. WHEN THE dropdowns are open, THE System SHALL provide proper ARIA labels and descriptions
4. WHEN THE User interacts with any component, THE System SHALL provide visual feedback (hover, focus states)
5. WHEN THE dialog is in responsive mode, THE System SHALL ensure all components adapt properly to small screens
