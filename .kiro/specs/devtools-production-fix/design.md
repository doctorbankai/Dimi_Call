# Design Document

## Overview

Cette fonctionnalité corrige le problème des DevTools en production en implémentant l'API manquante côté Electron et en gérant correctement l'état des DevTools. Le design se base sur l'architecture existante avec le `DevToolsService` côté renderer et ajoute les handlers IPC nécessaires côté main process.

## Architecture

### Composants existants à modifier
- **DevToolsService** : Service côté renderer qui gère l'état des DevTools
- **electron/main.ts** : Process principal Electron qui doit exposer les APIs DevTools
- **electron/preload.ts** : Bridge qui expose les APIs au renderer
- **BetaOptInSettings** : Composant UI qui gère l'activation/désactivation

### Flux de données
```
UI (BetaOptInSettings) → DevToolsService → IPC → Main Process → BrowserWindow.webContents.devToolsWebContents
```

## Components and Interfaces

### 1. Main Process APIs (electron/main.ts)

Nouveaux handlers IPC à ajouter :

```typescript
// Handler pour activer les DevTools
ipcMain.handle('devtools:enable', () => {
  if (mainWindow) {
    mainWindow.webContents.setDevToolsWebContents(null) // Reset si nécessaire
    // Permettre l'ouverture des DevTools
    return { success: true }
  }
  return { success: false, error: 'Fenêtre principale non disponible' }
})

// Handler pour désactiver les DevTools
ipcMain.handle('devtools:disable', () => {
  if (mainWindow) {
    // Fermer les DevTools si ouverts
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools()
    }
    return { success: true }
  }
  return { success: false, error: 'Fenêtre principale non disponible' }
})

// Handler pour vérifier l'état des DevTools
ipcMain.handle('devtools:is-enabled', () => {
  if (mainWindow) {
    // En production, on se base sur les préférences utilisateur
    // car les DevTools sont désactivés par défaut
    return { enabled: true } // Sera géré par le service
  }
  return { enabled: false }
})
```

### 2. Preload API Extension (electron/preload.ts)

Extension de l'interface `ElectronAPI` :

```typescript
interface ElectronAPI {
  // ... APIs existantes
  
  // APIs DevTools
  devTools: {
    enable: () => Promise<{ success: boolean; error?: string }>
    disable: () => Promise<{ success: boolean; error?: string }>
    isEnabled: () => Promise<{ enabled: boolean }>
  }
}
```

### 3. DevTools Service Enhancement

Le `DevToolsService` doit être modifié pour :
- Utiliser les nouvelles APIs IPC
- Gérer l'état de manière plus robuste
- Synchroniser avec les préférences bêta

### 4. Gestion des raccourcis clavier

Modification de la gestion des raccourcis dans `main.ts` :

```typescript
// Dans browser-window-created event
window.webContents.on('before-input-event', (event, input) => {
  if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
    // Vérifier si les DevTools sont activés par l'utilisateur
    const devToolsEnabled = DevToolsService.isEnabled() // Via IPC
    if (devToolsEnabled || is.dev) {
      window.webContents.openDevTools()
    } else {
      console.log('DevTools désactivés par l\'utilisateur')
    }
  }
})
```

## Data Models

### DevTools State
```typescript
interface DevToolsState {
  enabled: boolean
  lastModified: number
}
```

### Storage Key
```typescript
const DEVTOOLS_STORAGE_KEY = 'dimicall-devtools-enabled'
```

## Error Handling

### 1. IPC Communication Errors
- Gérer les cas où le main process n'est pas disponible
- Fallback gracieux si les APIs ne sont pas disponibles
- Logging approprié pour le débogage

### 2. Storage Errors
- Gérer les erreurs de localStorage
- Fallback vers un état par défaut (désactivé)
- Ne pas bloquer l'application en cas d'erreur

### 3. DevTools State Inconsistency
- Synchroniser l'état entre le service et Electron
- Vérifier l'état au démarrage de l'application
- Corriger automatiquement les incohérences

## Testing Strategy

### 1. Unit Tests
- Tester le `DevToolsService` avec des mocks IPC
- Tester les handlers IPC du main process
- Tester la persistance des préférences

### 2. Integration Tests
- Tester le flux complet d'activation/désactivation
- Tester la synchronisation avec les préférences bêta
- Tester la persistance entre les sessions

### 3. E2E Tests
- Tester le raccourci Ctrl+Shift+I en production
- Tester l'interface utilisateur des paramètres
- Tester le redémarrage de l'application

### 4. Manual Testing
- Tester sur une build de production
- Vérifier que les DevTools s'ouvrent correctement
- Tester tous les scénarios utilisateur

## Implementation Notes

### 1. Compatibilité
- S'assurer que le code fonctionne en développement et en production
- Maintenir la compatibilité avec l'ouverture automatique des DevTools en dev

### 2. Performance
- Les APIs IPC doivent être légères
- Éviter les appels IPC répétés inutiles
- Cacher l'état côté renderer quand possible

### 3. Sécurité
- Les DevTools ne doivent être activés qu'avec le consentement explicite de l'utilisateur
- Valider les paramètres des APIs IPC
- Éviter l'exposition d'APIs sensibles

### 4. UX
- L'activation/désactivation doit être immédiate
- Feedback visuel approprié dans l'interface
- Messages d'erreur clairs si quelque chose échoue