# Design Document

## Overview

Le bouton d'aide avec tutoriel intégré suit les mêmes patterns de design que les autres composants de l'application DimiCall. Il s'intègre harmonieusement dans la barre de titre existante et ouvre un dialog modal avec une interface sidebar similaire aux réglages. Le design privilégie la clarté, l'organisation hiérarchique du contenu, et l'accessibilité.

## Architecture

### Component Structure

```
HelpTutorialButton (nouveau bouton dans TitleBar)
├── HelpDialog (dialog modal principal)
│   ├── HelpSidebar (navigation des sections)
│   └── HelpContent (contenu dynamique)
└── HelpContentSections (données du tutoriel)
```

### Integration Points

- **TitleBar Component**: Ajout du bouton d'aide à côté des boutons existants
- **Dialog System**: Utilisation du système de dialog existant (`@/components/ui/dialog`)
- **Theme System**: Intégration avec le système de thème existant (Dark/Light)
- **Icon System**: Utilisation de Lucide React pour la cohérence visuelle

## Components and Interfaces

### 1. HelpTutorialButton Component

**Props Interface:**
```typescript
interface HelpTutorialButtonProps {
  theme: Theme;
  className?: string;
}
```

**Responsibilities:**
- Afficher le bouton d'aide avec l'icône appropriée
- Gérer l'état d'ouverture/fermeture du dialog
- Maintenir la cohérence visuelle avec les autres boutons de la barre de titre

### 2. HelpDialog Component

**Props Interface:**
```typescript
interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}
```

**State Management:**
```typescript
interface HelpDialogState {
  activeSection: HelpSection;
  searchQuery?: string;
}
```

**Responsibilities:**
- Gérer l'affichage du dialog modal
- Coordonner la navigation entre les sections
- Maintenir l'état de la section active

### 3. HelpSidebar Component

**Props Interface:**
```typescript
interface HelpSidebarProps {
  activeSection: HelpSection;
  onSectionChange: (section: HelpSection) => void;
  theme: Theme;
}
```

**Responsibilities:**
- Afficher la liste des sections disponibles
- Gérer la sélection des sections
- Indiquer visuellement la section active

### 4. HelpContent Component

**Props Interface:**
```typescript
interface HelpContentProps {
  section: HelpSection;
  theme: Theme;
}
```

**Responsibilities:**
- Afficher le contenu de la section sélectionnée
- Gérer le défilement du contenu
- Maintenir la lisibilité et l'organisation

## Data Models

### HelpSection Enum

```typescript
enum HelpSection {
  Introduction = 'introduction',
  UserInterface = 'user-interface',
  ContactManagement = 'contact-management',
  CallFeatures = 'call-features',
  ToolsAndActions = 'tools-and-actions',
  CommonErrors = 'common-errors',
  KeyboardShortcuts = 'keyboard-shortcuts',
  Settings = 'settings'
}
```

### HelpSectionData Interface

```typescript
interface HelpSectionData {
  id: HelpSection;
  title: string;
  icon: LucideIcon;
  description: string;
  content: HelpContentItem[];
}

interface HelpContentItem {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'warning' | 'tip';
  content: string | string[];
  level?: number; // Pour les headings
}
```

### Content Structure

**Section "Introduction":**
- Présentation de DimiCall
- Objectifs de l'application
- Vue d'ensemble des fonctionnalités principales

**Section "Interface utilisateur":**
- Explication de la barre de titre
- Description des badges (ADB, mise à jour, utilisateur)
- Navigation et zones principales

**Section "Gestion des contacts":**
- Import/Export de fichiers
- Manipulation des données
- Formats supportés (CSV, TSV, Excel)
- Gestion des colonnes

**Section "Fonctionnalités d'appel":**
- Configuration ADB
- Connexion au téléphone Android
- Fonctionnalités d'appel automatique
- Résolution des problèmes de connexion

**Section "Outils et actions":**
- Boutons du ruban principal
- Actions sur les contacts (email, SMS, rappel, RDV)
- Intégrations externes (LinkedIn, Google)
- Export vers Google Calendar/Contacts

**Section "Erreurs fréquentes":**
- Problèmes ADB courants
- Erreurs d'import/export
- Solutions étape par étape
- Liens vers la documentation

**Section "Raccourcis clavier":**
- Liste complète des raccourcis
- Raccourcis personnalisables
- Touches de fonction (F1-F12)

**Section "Paramètres":**
- Configuration des templates
- Paramètres d'apparence
- Gestion des mises à jour
- Options avancées

## Error Handling

### Dialog State Management

```typescript
const handleDialogError = (error: Error) => {
  console.error('Erreur dans le dialog d\'aide:', error);
  // Fallback vers la section Introduction
  setActiveSection(HelpSection.Introduction);
};
```

### Content Loading

```typescript
const handleContentError = (section: HelpSection) => {
  return {
    type: 'warning',
    content: 'Contenu temporairement indisponible. Veuillez réessayer.'
  };
};
```

## Testing Strategy

### Unit Tests

**HelpTutorialButton:**
- Rendu correct du bouton
- Gestion des clics
- Intégration avec le thème

**HelpDialog:**
- Ouverture/fermeture du dialog
- Navigation entre sections
- Gestion des états

**HelpSidebar:**
- Sélection des sections
- Indication visuelle de la section active
- Accessibilité clavier

**HelpContent:**
- Affichage correct du contenu
- Gestion du défilement
- Rendu des différents types de contenu

### Integration Tests

**TitleBar Integration:**
- Ajout correct du bouton dans la barre de titre
- Cohérence visuelle avec les autres boutons
- Comportement sur différentes plateformes (macOS/Windows)

**Theme Integration:**
- Application correcte des thèmes
- Transitions entre thèmes
- Contraste et lisibilité

### Accessibility Tests

**Keyboard Navigation:**
- Navigation au clavier dans le dialog
- Focus management
- Raccourcis clavier (Escape pour fermer)

**Screen Reader Support:**
- Attributs ARIA appropriés
- Descriptions alternatives
- Structure sémantique

### Visual Tests

**Responsive Design:**
- Adaptation à différentes tailles d'écran
- Lisibilité du contenu
- Comportement du sidebar sur petits écrans

**Cross-Platform:**
- Rendu correct sur macOS et Windows
- Intégration avec les contrôles natifs
- Cohérence visuelle

## Implementation Notes

### Styling Approach

- Utilisation des classes Tailwind existantes
- Respect des variables CSS du thème
- Cohérence avec les autres dialogs

### Performance Considerations

- Lazy loading du contenu des sections
- Memoization des composants statiques
- Optimisation des re-renders

### Accessibility Features

- Support complet du clavier
- Attributs ARIA appropriés
- Contraste suffisant pour tous les thèmes
- Structure sémantique HTML

### Internationalization Ready

- Structure préparée pour la traduction
- Séparation du contenu et de la logique
- Clés de traduction organisées par section