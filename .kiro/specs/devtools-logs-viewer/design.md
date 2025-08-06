# Design Document

## Overview

Cette fonctionnalité ajoute une nouvelle section "Logs" dans les réglages permettant aux utilisateurs de consulter et copier les logs du devtools. Elle implémente également une logique de désactivation des devtools en mode production tout en maintenant l'accès en mode développement.

## Architecture

### Détection de l'environnement

L'application utilise déjà la bibliothèque `@electron-toolkit/utils` avec `is.dev` pour détecter l'environnement :
- **Mode développement** : `is.dev === true` (quand `npm run dev`)
- **Mode production** : `is.dev === false` (application packagée)

### Service de gestion des logs

Un nouveau service `LogsService` sera créé pour :
- Capturer les logs du devtools en temps réel
- Stocker les logs en mémoire avec rotation automatique
- Fournir des méthodes de filtrage et d'export
- Gérer la persistance optionnelle des logs

### Intégration dans les réglages

La nouvelle section "Logs" sera ajoutée au `SettingsDialog` existant avec :
- Une nouvelle catégorie dans le tableau `categories`
- Un composant dédié `LogsViewer` pour l'affichage
- Intégration avec le système de navigation existant

## Components and Interfaces

### LogsService

```typescript
interface LogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  source: string;
  stack?: string;
}

interface LogsFilter {
  levels: ('error' | 'warn' | 'info' | 'debug')[];
  timeRange?: {
    start: number;
    end: number;
  };
  searchTerm?: string;
}

class LogsService {
  static getLogs(filter?: LogsFilter): LogEntry[];
  static addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void;
  static clearLogs(): void;
  static exportLogs(format: 'text' | 'json'): string;
  static getLogCount(): number;
  static isCapturing(): boolean;
  static startCapturing(): void;
  static stopCapturing(): void;
}
```

### LogsViewer Component

```typescript
interface LogsViewerProps {
  // Pas de props nécessaires, utilise le LogsService directement
}

interface LogsViewerState {
  logs: LogEntry[];
  filter: LogsFilter;
  isAutoScroll: boolean;
  selectedLevels: Set<string>;
}
```

### DevTools Environment Logic

Modification du `DevToolsService` existant pour intégrer la logique d'environnement :

```typescript
class DevToolsService {
  // Méthodes existantes...
  
  static shouldEnableDevTools(): boolean {
    // En développement : toujours autorisé
    if (is.dev) return true;
    
    // En production : selon les préférences utilisateur
    return this.isEnabled();
  }
  
  static isProductionMode(): boolean {
    return !is.dev;
  }
}
```

## Data Models

### LogEntry Structure

```typescript
interface LogEntry {
  id: string;           // UUID unique
  timestamp: number;    // Unix timestamp
  level: LogLevel;      // Niveau de log
  message: string;      // Message principal
  source: string;       // Source du log (console, network, etc.)
  stack?: string;       // Stack trace pour les erreurs
  metadata?: any;       // Données additionnelles
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug';
```

### Storage Strategy

- **Mémoire** : Buffer circulaire de 1000 entrées maximum
- **Persistance** : Optionnelle, dans localStorage avec clé `dimicall-logs`
- **Rotation** : Suppression automatique des logs > 24h

## Error Handling

### Capture des erreurs

1. **Console logs** : Interception via `console.log`, `console.error`, etc.
2. **Erreurs non gérées** : `window.onerror` et `window.unhandledrejection`
3. **Erreurs React** : Error boundaries
4. **Erreurs Electron** : IPC pour les erreurs du processus principal

### Gestion des erreurs du service

```typescript
try {
  LogsService.addLog(entry);
} catch (error) {
  // Fallback silencieux pour éviter les boucles infinies
  console.warn('Failed to add log entry:', error);
}
```

## Testing Strategy

### Tests unitaires

1. **LogsService**
   - Test de l'ajout/suppression de logs
   - Test des filtres
   - Test de l'export
   - Test de la rotation

2. **LogsViewer Component**
   - Test du rendu des logs
   - Test des filtres UI
   - Test de la copie dans le presse-papiers
   - Test du scroll automatique

3. **DevTools Environment Logic**
   - Test de la détection d'environnement
   - Test de la logique de désactivation

### Tests d'intégration

1. **Settings Integration**
   - Test de l'ajout de la nouvelle section
   - Test de la navigation
   - Test de la sauvegarde des préférences

2. **DevTools Behavior**
   - Test en mode développement
   - Test en mode production
   - Test du toggle utilisateur

### Tests E2E

1. **User Workflow**
   - Ouvrir les réglages → section Logs
   - Filtrer les logs par niveau
   - Copier les logs
   - Vider les logs

2. **Environment Switching**
   - Vérifier le comportement en dev vs prod
   - Tester la persistance des préférences

## Implementation Details

### Intégration dans SettingsDialog

Ajout dans le tableau `categories` :

```typescript
{
  id: 'logs' as SettingsCategory,
  label: 'Logs',
  icon: FileText, // Nouvelle icône
  description: 'Consulter et copier les logs système'
}
```

### Capture des logs console

```typescript
// Override des méthodes console
const originalConsole = { ...console };

['log', 'error', 'warn', 'info', 'debug'].forEach(level => {
  console[level] = (...args) => {
    // Appeler la méthode originale
    originalConsole[level](...args);
    
    // Capturer pour notre service
    LogsService.addLog({
      level: level as LogLevel,
      message: args.join(' '),
      source: 'console'
    });
  };
});
```

### UI Components Structure

```
LogsViewer/
├── LogsHeader (filtres, actions)
├── LogsList (liste scrollable)
│   └── LogEntry (item individuel)
└── LogsFooter (statistiques, clear)
```

### Electron Main Process Integration

Ajout d'IPC handlers pour les logs du processus principal :

```typescript
ipcMain.handle('logs:get-main-logs', () => {
  return mainProcessLogs;
});

ipcMain.handle('logs:clear-main-logs', () => {
  mainProcessLogs.length = 0;
  return { success: true };
});
```

## Performance Considerations

1. **Mémoire** : Limitation à 1000 entrées avec rotation
2. **Rendu** : Virtualisation pour les grandes listes
3. **Filtrage** : Debounce sur les filtres de recherche
4. **Export** : Traitement asynchrone pour les gros volumes

## Security Considerations

1. **Données sensibles** : Filtrage automatique des tokens/passwords
2. **Taille des logs** : Limitation pour éviter les attaques DoS
3. **Accès** : Logs disponibles uniquement dans l'interface utilisateur
4. **Persistance** : Chiffrement optionnel des logs sauvegardés