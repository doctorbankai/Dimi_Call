# Design Document

## Overview

Cette amélioration ajoute des sélecteurs de date relatifs intuitifs au dialog de programmation de rappels existant. Le système permettra aux utilisateurs de choisir rapidement une date future en spécifiant un nombre et une unité de temps (jours, semaines, mois, années), qui sera automatiquement calculée et synchronisée avec les champs de date/heure existants.

## Architecture

### Composants Existants
- **ContactTable**: Contient les colonnes `dateRappel` et `heureRappel` 
- **DateTimeCell**: Composant existant pour la saisie de dates et heures avec calendrier et sélecteurs de temps
- **Dialog système**: Infrastructure de dialog basée sur Radix UI déjà en place

### Nouveaux Composants
- **ReminderDialog**: Dialog principal pour la programmation de rappels
- **RelativeDateSelector**: Composant pour la sélection de dates relatives
- **DateCalculationService**: Service utilitaire pour les calculs de dates

## Components and Interfaces

### ReminderDialog Component

```typescript
interface ReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  initialDate?: string;
  initialTime?: string;
  onSave: (date: string, time: string) => void;
}

interface ReminderDialogState {
  selectedDate: string;
  selectedTime: string;
  relativeQuantity: number | '';
  relativeUnit: 'days' | 'weeks' | 'months' | 'years';
  useRelativeSelector: boolean;
}
```

### RelativeDateSelector Component

```typescript
interface RelativeDateSelectorProps {
  onDateChange: (date: string) => void;
  currentDate: string;
  disabled?: boolean;
}

interface RelativeDateSelectorState {
  quantity: number | '';
  unit: 'days' | 'weeks' | 'months' | 'years';
}
```

### DateCalculationService

```typescript
class DateCalculationService {
  static calculateFutureDate(
    quantity: number, 
    unit: 'days' | 'weeks' | 'months' | 'years'
  ): string;
  
  static formatDateForDisplay(date: string): string;
  static validateDateRange(date: string): boolean;
  static getUnitLabel(unit: string, quantity: number): string;
}
```

## Data Models

### Extensions aux Types Existants

Aucune modification nécessaire aux interfaces existantes. Le système utilisera les champs `dateRappel` et `heureRappel` déjà présents dans l'interface `Contact`.

### Nouvelles Structures de Données

```typescript
interface RelativeDateConfig {
  quantity: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  calculatedDate: string;
}

interface DateSelectorValidation {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
}
```

## Architecture Détaillée

### Structure du Dialog

```
ReminderDialog
├── DialogHeader
│   └── "Programmer un Rappel"
├── ContactInfo
│   └── "Contact: {contact.prenom} {contact.nom}"
├── DateTimeInputs
│   ├── ManualDateInput (type="date")
│   └── ManualTimeInput (type="time")
├── RelativeDateSelector
│   ├── QuantityInput (number input)
│   ├── UnitSelector (dropdown)
│   └── PreviewText ("Dans X jour(s)")
└── DialogActions
    ├── CancelButton
    └── SaveButton
```

### Flux de Données

1. **Initialisation**: Le dialog s'ouvre avec les valeurs existantes du contact
2. **Sélection Manuelle**: L'utilisateur modifie directement les champs date/heure
3. **Sélection Relative**: L'utilisateur utilise les sélecteurs relatifs
4. **Synchronisation**: Les modifications dans un mode mettent à jour l'autre
5. **Validation**: Vérification des limites et cohérence des données
6. **Sauvegarde**: Application des changements au contact

### Logique de Synchronisation

```typescript
// Quand l'utilisateur modifie la date manuelle
onManualDateChange(newDate: string) {
  setSelectedDate(newDate);
  setUseRelativeSelector(false);
  clearRelativeSelectors();
}

// Quand l'utilisateur modifie les sélecteurs relatifs
onRelativeChange(quantity: number, unit: string) {
  const calculatedDate = DateCalculationService.calculateFutureDate(quantity, unit);
  setSelectedDate(calculatedDate);
  setUseRelativeSelector(true);
}
```

## Error Handling

### Validation des Entrées

1. **Quantité**: Nombres entiers positifs uniquement (1-999)
2. **Date Calculée**: Vérification que la date ne dépasse pas 10 ans dans le futur
3. **Format de Date**: Validation du format YYYY-MM-DD
4. **Format d'Heure**: Validation du format HH:mm

### Messages d'Erreur

```typescript
const ERROR_MESSAGES = {
  INVALID_QUANTITY: "Veuillez saisir un nombre entier positif",
  DATE_TOO_FAR: "La date ne peut pas dépasser 10 ans dans le futur",
  INVALID_DATE_FORMAT: "Format de date invalide",
  INVALID_TIME_FORMAT: "Format d'heure invalide (HH:mm)",
  PAST_DATE: "La date ne peut pas être dans le passé"
};
```

### Gestion des Cas Limites

- **Dates invalides**: Affichage d'un message d'erreur et désactivation du bouton de sauvegarde
- **Quantités excessives**: Limitation automatique et avertissement
- **Changement de mois**: Gestion correcte des mois avec différents nombres de jours
- **Années bissextiles**: Prise en compte pour les calculs de dates

## Testing Strategy

### Tests Unitaires

1. **DateCalculationService**
   - Calculs de dates futures pour chaque unité
   - Gestion des années bissextiles
   - Validation des limites de dates

2. **RelativeDateSelector**
   - Rendu correct des options
   - Gestion des événements de changement
   - Validation des entrées

3. **ReminderDialog**
   - Synchronisation entre modes de sélection
   - Sauvegarde des données
   - Gestion des erreurs

### Tests d'Intégration

1. **Flux Complet**: Ouverture du dialog → sélection de date → sauvegarde
2. **Synchronisation**: Basculement entre sélection manuelle et relative
3. **Persistance**: Vérification que les données sont correctement sauvegardées dans le contact

### Tests d'Accessibilité

1. **Navigation Clavier**: Tab entre les champs, Enter pour valider
2. **Lecteurs d'Écran**: Labels appropriés et descriptions
3. **Contraste**: Respect des standards WCAG pour les couleurs
4. **Focus Management**: Gestion correcte du focus dans le dialog

### Tests de Localisation

1. **Pluralisation**: Vérification des formes singulier/pluriel
2. **Format de Dates**: Affichage correct selon la locale française
3. **Messages d'Erreur**: Cohérence avec la localisation existante

## Intégration avec l'Existant

### Réutilisation des Composants

- **Dialog Infrastructure**: Utilisation des composants Radix UI existants
- **Input Styling**: Réutilisation des classes CSS existantes (`INPUT_BASE_CLASS`)
- **Theme Support**: Intégration avec le système de thèmes existant
- **Button Components**: Utilisation des boutons standardisés

### Points d'Intégration

1. **ContactTable**: Ajout d'un bouton ou action pour ouvrir le dialog de rappel
2. **Contact Updates**: Utilisation du système `onUpdateContact` existant
3. **Styling**: Cohérence avec le design system existant (Tailwind CSS)
4. **State Management**: Intégration avec la gestion d'état des contacts

### Migration et Compatibilité

- **Données Existantes**: Aucune migration nécessaire, les champs existent déjà
- **Rétrocompatibilité**: Les fonctionnalités existantes restent inchangées
- **Progressive Enhancement**: Le nouveau système s'ajoute sans remplacer l'existant