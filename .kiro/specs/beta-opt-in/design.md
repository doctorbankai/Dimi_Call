# Design Document

## Overview

Cette fonctionnalité ajoute un système d'opt-in pour les versions bêta de DimiCall, permettant aux utilisateurs de recevoir les pre-releases GitHub avec activation automatique des DevTools pour faciliter le débogage et le feedback. Le système s'intègre dans l'interface de paramètres existante et étend le système de mise à jour automatique actuel.

## Architecture

### Composants principaux

1. **BetaOptInSettings** - Nouveau composant pour la configuration des versions bêta
2. **Extension du système de mise à jour** - Modification du hook `useAutoUpdate` et des services associés
3. **Gestion des préférences** - Système de stockage local pour les préférences utilisateur
4. **Indicateurs visuels** - Badges et indicateurs pour identifier les versions bêta
5. **Gestion des DevTools** - Activation/désactivation automatique selon le type de version

### Intégration avec l'existant

Le système s'intègre avec :
- Le composant `SettingsDialog` existant pour l'interface utilisateur
- Le hook `useAutoUpdate` pour la logique de mise à jour
- Le système de stockage local existant pour la persistance
- L'API Electron pour la gestion des DevTools

## Components and Interfaces

### 1. Types et Interfaces

```typescript
// Extension des types existants dans src/types/update.ts
export interface BetaPreferences {
  /** Indique si l'utilisateur a opté pour les versions bêta */
  enabled: boolean;
  /** Timestamp de la dernière modification des préférences */
  lastModified: number;
  /** Indique si l'utilisateur a été averti des risques */
  hasBeenWarned: boolean;
}

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
  /** Nouveau : indique si c'est une version bêta */
  isBeta?: boolean;
  /** Nouveau : indique si c'est une pre-release GitHub */
  isPrerelease?: boolean;
}

export interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  progress: number;
  updateInfo: UpdateInfo | null;
  /** Nouveau : préférences bêta de l'utilisateur */
  betaPreferences: BetaPreferences;
}
```

### 2. Service de gestion des préférences bêta

```typescript
// src/services/betaPreferencesService.ts
export interface BetaPreferencesService {
  /** Récupère les préférences bêta actuelles */
  getBetaPreferences(): BetaPreferences;
  
  /** Sauvegarde les préférences bêta */
  setBetaPreferences(preferences: BetaPreferences): void;
  
  /** Active/désactive les versions bêta */
  toggleBetaOptIn(enabled: boolean): void;
  
  /** Vérifie si l'utilisateur utilise actuellement une version bêta */
  isCurrentVersionBeta(): boolean;
  
  /** Marque l'utilisateur comme ayant été averti des risques */
  markAsWarned(): void;
}
```

### 3. Composant BetaOptInSettings

```typescript
// src/components/BetaOptInSettings.tsx
export interface BetaOptInSettingsProps {
  /** Préférences bêta actuelles */
  betaPreferences: BetaPreferences;
  
  /** Callback appelé quand les préférences changent */
  onPreferencesChange: (preferences: BetaPreferences) => void;
  
  /** Indique si une version bêta est actuellement utilisée */
  isCurrentVersionBeta: boolean;
  
  /** Callback pour revenir à la version stable */
  onRevertToStable?: () => void;
}
```

### 4. Extension du hook useAutoUpdate

```typescript
// Extension de src/hooks/useAutoUpdate.ts
export interface UseAutoUpdateResult {
  updateState: UpdateState;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  
  /** Nouveau : gestion des préférences bêta */
  betaPreferences: BetaPreferences;
  setBetaPreferences: (preferences: BetaPreferences) => void;
  
  /** Nouveau : revenir à la version stable */
  revertToStable: () => Promise<void>;
}
```

## Data Models

### 1. Modèle de préférences bêta

```typescript
interface BetaPreferences {
  enabled: boolean;           // Opt-in activé/désactivé
  lastModified: number;       // Timestamp de dernière modification
  hasBeenWarned: boolean;     // Utilisateur averti des risques
}
```

### 2. Clés de stockage local

```typescript
const STORAGE_KEYS = {
  BETA_PREFERENCES: 'dimicall-beta-preferences',
  CURRENT_VERSION_TYPE: 'dimicall-version-type', // 'stable' | 'beta'
} as const;
```

### 3. Configuration des DevTools

```typescript
interface DevToolsConfig {
  enabled: boolean;           // DevTools activés/désactivés
  reason: 'beta' | 'manual';  // Raison de l'activation
}
```

## Error Handling

### 1. Gestion des erreurs de préférences

- **Préférences corrompues** : Retour aux valeurs par défaut avec notification
- **Échec de sauvegarde** : Retry automatique avec fallback
- **Conflits de version** : Migration automatique des anciennes préférences

### 2. Gestion des erreurs de mise à jour

- **Échec de récupération des pre-releases** : Fallback vers les releases stables
- **Erreur de téléchargement bêta** : Notification avec option de retry
- **Échec d'installation** : Rollback automatique vers la version précédente

### 3. Gestion des erreurs DevTools

- **Échec d'activation DevTools** : Log de l'erreur sans bloquer l'application
- **Permissions insuffisantes** : Notification informative à l'utilisateur

## Testing Strategy

### 1. Tests unitaires

```typescript
// Tests pour BetaPreferencesService
describe('BetaPreferencesService', () => {
  test('should save and retrieve beta preferences');
  test('should handle corrupted preferences gracefully');
  test('should migrate old preference format');
});

// Tests pour BetaOptInSettings
describe('BetaOptInSettings', () => {
  test('should render beta opt-in checkbox');
  test('should show warning dialog on first activation');
  test('should display beta badge when enabled');
});
```

### 2. Tests d'intégration

```typescript
// Tests pour le système de mise à jour étendu
describe('Beta Update System', () => {
  test('should check for pre-releases when beta enabled');
  test('should only check stable releases when beta disabled');
  test('should enable DevTools for beta versions');
  test('should disable DevTools for stable versions');
});
```

### 3. Tests end-to-end

```typescript
// Tests pour le workflow complet
describe('Beta Opt-in Workflow', () => {
  test('should complete full beta opt-in process');
  test('should successfully revert to stable version');
  test('should persist preferences across app restarts');
});
```

## Implementation Details

### 1. Interface utilisateur

**Emplacement** : Dans le `SettingsDialog`, section "Mise à jour"

**Composants** :
- Checkbox "Recevoir les versions bêta"
- Badge "BETA" dans la barre de titre si version bêta active
- Bouton "Revenir à la version stable" si applicable
- Dialog d'avertissement lors de la première activation

### 2. Logique de mise à jour

**Modification de l'API Electron** :
- Extension pour récupérer les pre-releases GitHub
- Filtrage selon les préférences utilisateur
- Gestion des métadonnées de version (stable/beta)

**Workflow de mise à jour** :
1. Vérification des préférences utilisateur
2. Requête vers GitHub API (releases + pre-releases si bêta activé)
3. Filtrage et sélection de la version appropriée
4. Téléchargement et installation standard

### 3. Gestion des DevTools

**Activation automatique** :
- Détection du type de version au démarrage
- Activation des DevTools si version bêta
- Désactivation si version stable

**API Electron nécessaire** :
```typescript
// Dans electron/main.ts
interface ElectronAPI {
  enableDevTools: () => void;
  disableDevTools: () => void;
  isDevToolsEnabled: () => boolean;
}
```

### 4. Persistance des données

**Stockage local** :
- Préférences bêta dans localStorage
- Type de version actuelle
- État des DevTools

**Migration des données** :
- Gestion des anciennes versions de préférences
- Nettoyage automatique des données obsolètes

### 5. Indicateurs visuels

**Badge BETA** :
- Affiché dans la TitleBar si version bêta
- Style distinctif (couleur orange/rouge)
- Tooltip explicatif

**Notifications** :
- Avertissement lors de l'activation des versions bêta
- Confirmation lors du retour aux versions stables
- Notifications de mise à jour spécifiques aux bêta

## Security Considerations

### 1. Validation des versions

- Vérification de la signature des pre-releases
- Validation de l'origine GitHub officielle
- Contrôle d'intégrité des téléchargements

### 2. Gestion des DevTools

- Activation uniquement pour les versions bêta légitimes
- Désactivation automatique en production stable
- Logs sécurisés sans exposition de données sensibles

### 3. Préférences utilisateur

- Validation des données de préférences
- Sanitisation des entrées utilisateur
- Protection contre la manipulation des préférences

## Performance Considerations

### 1. Requêtes GitHub API

- Cache des informations de release
- Limitation du taux de requêtes
- Fallback en cas d'indisponibilité de l'API

### 2. Stockage local

- Optimisation de la taille des données stockées
- Nettoyage périodique des données obsolètes
- Compression des préférences si nécessaire

### 3. Interface utilisateur

- Lazy loading des composants bêta
- Optimisation des re-renders
- Debouncing des changements de préférences