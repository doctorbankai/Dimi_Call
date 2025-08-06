# Design Document

## Overview

Cette fonctionnalité corrige plusieurs problèmes d'interface utilisateur liés au mode sombre et améliore l'expérience utilisateur avec des ajustements spécifiques. Les corrections incluent la visibilité des icônes dans les sélecteurs de date/heure, la mise à jour des libellés d'unités de temps, l'ajout d'un nouveau statut de contact, et l'amélioration de la cohérence des sélecteurs d'heure.

## Architecture

### Composants Affectés

1. **Input Component** (`src/components/ui/input.tsx`)
   - Composant de base pour tous les inputs
   - Nécessite des styles spécifiques pour les inputs date/time en mode sombre

2. **RelativeDateSelector** (`src/components/RelativeDateSelector.tsx`)
   - Contient les unités de temps à modifier
   - Gère la logique de calcul des dates relatives

3. **Constants** (`src/constants.tsx`)
   - Définit les statuts de contact et leurs couleurs
   - Nécessite l'ajout du nouveau statut "A0"

4. **Types** (`src/types.ts`)
   - Énumération ContactStatus à étendre

5. **ReminderDialog** (`src/components/ReminderDialog.tsx`)
   - Utilise les sélecteurs de date/heure
   - Peut bénéficier du sélecteur d'heure personnalisé

## Components and Interfaces

### 1. Enhanced Input Component

Le composant Input sera étendu pour gérer spécifiquement les problèmes de visibilité des icônes en mode sombre :

```typescript
interface InputProps extends React.ComponentProps<"input"> {
  type?: string;
  className?: string;
}
```

**Modifications nécessaires :**
- Ajout de styles CSS spécifiques pour `input[type="date"]` et `input[type="time"]`
- Utilisation de filtres CSS ou de variables CSS personnalisées pour les icônes
- Support des pseudo-éléments `::-webkit-calendar-picker-indicator`

### 2. Time Unit Constants Update

Modification de la constante `TIME_UNITS` dans RelativeDateSelector :

```typescript
const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'days', label: 'jour(s)' },
  { value: 'weeks', label: 'semaine(s)' },
  { value: 'months', label: 'mois' },
  { value: 'years', label: 'an(s)' } // Changé de 'année(s)'
];
```

### 3. New Contact Status

Extension de l'énumération ContactStatus et des constantes associées :

```typescript
export enum ContactStatus {
  // ... statuts existants
  A0 = "A0",
}

export const STATUS_COLORS: Record<ContactStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  // ... couleurs existantes
  [ContactStatus.A0]: { 
    bg: "bg-purple-200", 
    text: "text-purple-700", 
    darkBg: "dark:bg-purple-600", 
    darkText: "dark:text-purple-100" 
  },
};
```

### 4. Custom Time Picker Component

Création d'un composant TimePicker réutilisable basé sur le widget existant :

```typescript
interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}
```

## Data Models

### ContactStatus Extension

```typescript
export enum ContactStatus {
  NonDefini = "Non défini",
  MauvaisNum = "Mauvais num",
  Repondeur = "Répondeur",
  ARappeler = "À rappeler",
  PasInteresse = "Pas intéressé",
  Argumente = "Argumenté",
  DO = "DO",
  RO = "RO",
  ListeNoire = "Liste noire",
  Premature = "Prématuré",
  A0 = "A0", // Nouveau statut
}
```

### Color Configuration

```typescript
interface StatusColorConfig {
  bg: string;
  text: string;
  darkBg: string;
  darkText: string;
  indicator?: string; // Couleur de l'indicateur rond
}
```

## Error Handling

### CSS Fallbacks

- Utilisation de fallbacks CSS pour les navigateurs ne supportant pas certaines propriétés
- Détection de support pour les filtres CSS
- Styles de base garantissant une visibilité minimale

### Browser Compatibility

- Support des pseudo-éléments WebKit pour Chrome/Safari
- Styles alternatifs pour Firefox
- Gestion gracieuse des navigateurs plus anciens

### Validation

- Validation que le nouveau statut "A0" est correctement géré dans tous les composants
- Tests de contraste pour s'assurer de la lisibilité en mode sombre
- Vérification de la cohérence des couleurs entre les thèmes

## Testing Strategy

### Unit Tests

1. **Input Component Tests**
   - Vérification du rendu correct en mode sombre
   - Test des styles CSS appliqués
   - Validation de l'accessibilité

2. **RelativeDateSelector Tests**
   - Test du changement de libellé "année(s)" → "an(s)"
   - Vérification que les calculs fonctionnent toujours
   - Test de la prévisualisation avec le nouveau libellé

3. **Status Tests**
   - Validation de l'ajout du statut "A0"
   - Test des couleurs en mode clair et sombre
   - Vérification de l'export/import avec le nouveau statut

### Integration Tests

1. **Theme Switching Tests**
   - Test de basculement entre modes clair/sombre
   - Vérification de la persistance des styles
   - Validation de la visibilité des icônes

2. **Contact Management Tests**
   - Test de sélection du statut "A0"
   - Vérification du filtrage par statut
   - Test de l'export avec le nouveau statut

### Visual Regression Tests

1. **Screenshot Tests**
   - Capture des sélecteurs date/time en mode sombre
   - Validation visuelle du nouveau statut "A0"
   - Comparaison avant/après pour les unités de temps

### Accessibility Tests

1. **Contrast Tests**
   - Vérification du contraste des icônes en mode sombre
   - Test de lisibilité du nouveau statut
   - Validation WCAG 2.1 AA

2. **Screen Reader Tests**
   - Test de lecture des nouveaux éléments
   - Vérification des labels ARIA
   - Validation de la navigation au clavier

## Implementation Notes

### CSS Strategy

Utilisation de variables CSS personnalisées pour gérer les couleurs des icônes :

```css
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: var(--date-time-icon-filter);
}

:root {
  --date-time-icon-filter: none;
}

.dark {
  --date-time-icon-filter: invert(1) brightness(0.8);
}
```

### Component Organization

- Maintenir la compatibilité avec l'API existante
- Utiliser des props optionnelles pour les nouvelles fonctionnalités
- Préserver les performances existantes

### Migration Strategy

- Déploiement progressif des changements
- Tests de régression complets
- Documentation des changements pour l'équipe