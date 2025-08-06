# Design Document

## Overview

Cette fonctionnalité corrige le problème de sauvegarde des paramètres des versions bêta et des outils de développement dans le SettingsDialog. Le problème actuel est que les handlers `handleBetaPreferencesChange` et `handleDevToolsToggle` appliquent immédiatement les changements via leurs services respectifs, mais la fonction `handleSave` ne persiste pas ces préférences, créant une incohérence dans le comportement de sauvegarde.

## Architecture

### Problème actuel

1. **Application immédiate** : Les changements sont appliqués immédiatement via les services
2. **Sauvegarde manquante** : La fonction `handleSave` ne sauvegarde pas ces préférences
3. **Incohérence** : Les autres paramètres ne sont sauvegardés qu'au clic sur "Sauvegarder"

### Solution proposée

1. **Sauvegarde centralisée** : Ajouter la sauvegarde des préférences bêta et DevTools dans `handleSave`
2. **Réinitialisation complète** : Étendre `handleReset` pour inclure ces préférences
3. **Gestion d'erreurs** : Ajouter la gestion d'erreurs pour les opérations de sauvegarde
4. **Cohérence comportementale** : Maintenir l'application immédiate tout en assurant la persistance

## Components and Interfaces

### 1. Modifications du SettingsDialog

#### Extension de la fonction handleSave

```typescript
const handleSave = () => {
  try {
    // Sauvegarde existante (templates, signature, etc.)
    const data = {
      templates,
      signature,
      lastModified: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Sauvegarde des autres paramètres existants...
    
    // NOUVEAU : Sauvegarde des préférences bêta
    BetaPreferencesService.setBetaPreferences(betaPreferences);
    
    // NOUVEAU : Sauvegarde de l'état des DevTools
    DevToolsService.setEnabled(devToolsEnabled);
    
    setHasChanges(false);
    onSave();
    onClose();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    // Afficher un message d'erreur à l'utilisateur
    setError('Erreur lors de la sauvegarde des paramètres');
  }
};
```

#### Extension de la fonction handleReset

```typescript
const handleReset = () => {
  // Réinitialisation existante
  setTemplates(defaultTemplates);
  setSignature('');
  // ... autres réinitialisations existantes
  
  // NOUVEAU : Réinitialisation des préférences bêta
  const defaultBetaPrefs = {
    enabled: false,
    lastModified: Date.now(),
    hasBeenWarned: false,
  };
  setBetaPreferences(defaultBetaPrefs);
  BetaPreferencesService.setBetaPreferences(defaultBetaPrefs);
  
  // NOUVEAU : Réinitialisation des DevTools
  setDevToolsEnabled(false);
  DevToolsService.disableDevTools();
  
  setHasChanges(true);
};
```

#### Gestion d'erreurs améliorée

```typescript
interface SettingsError {
  message: string;
  type: 'beta' | 'devtools' | 'general';
}

const [error, setError] = useState<SettingsError | null>(null);

const handleBetaPreferencesChange = (preferences: BetaPreferences) => {
  try {
    setBetaPreferences(preferences);
    // Application immédiate maintenue pour le feedback utilisateur
    BetaPreferencesService.setBetaPreferences(preferences);
    setHasChanges(true);
    setError(null); // Effacer les erreurs précédentes
  } catch (error) {
    console.error('Erreur lors de la modification des préférences bêta:', error);
    setError({
      message: 'Erreur lors de la sauvegarde des préférences bêta',
      type: 'beta'
    });
  }
};

const handleDevToolsToggle = (enabled: boolean) => {
  try {
    if (enabled) {
      DevToolsService.enableDevTools();
    } else {
      DevToolsService.disableDevTools();
    }
    setDevToolsEnabled(enabled);
    setHasChanges(true);
    setError(null); // Effacer les erreurs précédentes
  } catch (error) {
    console.error('Erreur lors du toggle des DevTools:', error);
    setError({
      message: 'Erreur lors de la modification des outils de développement',
      type: 'devtools'
    });
  }
};
```

### 2. Interface utilisateur pour les erreurs

#### Composant d'affichage d'erreur

```typescript
const ErrorDisplay: React.FC<{ error: SettingsError; onDismiss: () => void }> = ({ error, onDismiss }) => (
  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-800 dark:text-red-200">{error.message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="h-auto p-1 text-red-600 hover:text-red-800"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  </div>
);
```

### 3. Validation des données

#### Validation des préférences bêta

```typescript
const validateBetaPreferences = (preferences: BetaPreferences): boolean => {
  return (
    typeof preferences.enabled === 'boolean' &&
    typeof preferences.lastModified === 'number' &&
    typeof preferences.hasBeenWarned === 'boolean'
  );
};
```

#### Validation de l'état des DevTools

```typescript
const validateDevToolsState = (enabled: boolean): boolean => {
  return typeof enabled === 'boolean';
};
```

## Data Models

### 1. État des paramètres étendus

```typescript
interface SettingsState {
  // États existants
  templates: EmailTemplates;
  signature: string;
  // ... autres états existants
  
  // NOUVEAUX : États pour bêta et DevTools
  betaPreferences: BetaPreferences;
  devToolsEnabled: boolean;
  
  // Gestion d'erreurs
  error: SettingsError | null;
}
```

### 2. Types d'erreurs

```typescript
interface SettingsError {
  message: string;
  type: 'beta' | 'devtools' | 'general';
  timestamp?: number;
}
```

## Error Handling

### 1. Stratégie de gestion d'erreurs

- **Erreurs de sauvegarde** : Affichage d'un message d'erreur sans bloquer l'interface
- **Erreurs de service** : Log des erreurs avec fallback vers les valeurs par défaut
- **Erreurs de validation** : Prévention des données invalides avec messages explicites

### 2. Récupération d'erreurs

```typescript
const recoverFromError = (errorType: string) => {
  switch (errorType) {
    case 'beta':
      // Restaurer les préférences bêta par défaut
      setBetaPreferences(DEFAULT_BETA_PREFERENCES);
      break;
    case 'devtools':
      // Restaurer l'état DevTools par défaut
      setDevToolsEnabled(false);
      break;
    default:
      // Récupération générale
      handleReset();
  }
};
```

### 3. Retry automatique

```typescript
const saveWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await handleSave();
      return; // Succès
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Échec final
      }
      // Attendre avant le retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## Testing Strategy

### 1. Tests unitaires

```typescript
describe('SettingsDialog Save Functionality', () => {
  test('should save beta preferences when handleSave is called');
  test('should save DevTools state when handleSave is called');
  test('should handle save errors gracefully');
  test('should reset beta preferences and DevTools when handleReset is called');
});
```

### 2. Tests d'intégration

```typescript
describe('Settings Integration', () => {
  test('should persist beta preferences across dialog open/close');
  test('should persist DevTools state across dialog open/close');
  test('should maintain consistency between UI state and service state');
});
```

### 3. Tests end-to-end

```typescript
describe('Settings Save Workflow', () => {
  test('should complete full save workflow for beta preferences');
  test('should complete full save workflow for DevTools');
  test('should handle error scenarios gracefully');
});
```

## Implementation Details

### 1. Ordre des opérations de sauvegarde

1. **Validation** : Vérifier la validité des données
2. **Sauvegarde locale** : Sauvegarder dans localStorage
3. **Services** : Appeler les services spécialisés
4. **État UI** : Mettre à jour l'état de l'interface
5. **Nettoyage** : Effacer les erreurs et fermer le dialog

### 2. Gestion de la cohérence

- **Application immédiate** : Maintenir le feedback immédiat pour l'UX
- **Sauvegarde centralisée** : Assurer la persistance via handleSave
- **Synchronisation** : Garder l'état UI et les services synchronisés

### 3. Backward compatibility

- **Migration** : Gérer les anciennes versions de préférences
- **Fallback** : Valeurs par défaut en cas de données corrompues
- **Validation** : Vérifier la structure des données existantes

## Performance Considerations

### 1. Optimisations

- **Debouncing** : Éviter les sauvegardes trop fréquentes
- **Batch operations** : Grouper les opérations de sauvegarde
- **Lazy loading** : Charger les préférences à la demande

### 2. Monitoring

- **Métriques** : Suivre les taux de succès/échec de sauvegarde
- **Logs** : Enregistrer les opérations importantes
- **Performance** : Mesurer les temps de sauvegarde

## Security Considerations

### 1. Validation des données

- **Sanitisation** : Nettoyer les données avant sauvegarde
- **Validation** : Vérifier la structure et les types
- **Limites** : Imposer des limites sur les tailles de données

### 2. Stockage sécurisé

- **Chiffrement** : Considérer le chiffrement des données sensibles
- **Isolation** : Séparer les données par domaine
- **Nettoyage** : Supprimer les données obsolètes