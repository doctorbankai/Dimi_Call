# Design Document

## Overview

Cette solution résout le problème des permissions ADB sur macOS en implémentant une vérification et correction automatique des permissions d'exécution des binaires ADB au démarrage de l'application. La solution comprend des modifications à la configuration Electron Builder et l'ajout d'une fonction de vérification des permissions dans le processus principal.

## Architecture

### Composants Principaux

1. **Permission Checker Service** - Service qui vérifie et corrige les permissions des binaires ADB
2. **Enhanced getAdbPath Function** - Version améliorée qui inclut la vérification des permissions
3. **Electron Builder Configuration** - Configuration mise à jour pour préserver les permissions
4. **Startup Permission Validation** - Validation automatique au démarrage de l'application

### Flux de Données

```
Application Startup
    ↓
Permission Checker Service
    ↓
Verify ADB Binary Permissions
    ↓
[Permissions OK?] → Yes → Continue Normal Operation
    ↓ No
Fix Permissions (chmod +x)
    ↓
[Fix Successful?] → Yes → Continue Normal Operation
    ↓ No
Log Error & Show User Instructions
```

## Components and Interfaces

### 1. Permission Checker Service

```typescript
interface AdbPermissionChecker {
  checkAndFixPermissions(adbPath: string): Promise<PermissionCheckResult>
  isExecutable(filePath: string): Promise<boolean>
  makeExecutable(filePath: string): Promise<boolean>
  validateAllPlatformTools(): Promise<ValidationResult>
}

interface PermissionCheckResult {
  success: boolean
  wasFixed: boolean
  error?: string
  permissions?: string
}
```

### 2. Enhanced ADB Path Resolution

```typescript
interface AdbPathResolver {
  getAdbPath(): Promise<string>
  validateAdbPath(path: string): Promise<boolean>
  ensureAdbExecutable(path: string): Promise<string>
}
```

### 3. Platform Tools Validator

```typescript
interface PlatformToolsValidator {
  validateAllBinaries(toolsPath: string): Promise<BinaryValidationResult[]>
  fixBinaryPermissions(binariesPath: string[]): Promise<FixResult[]>
}
```

## Data Models

### Permission Check Result
```typescript
type PermissionCheckResult = {
  filePath: string
  isExecutable: boolean
  currentPermissions: string
  fixAttempted: boolean
  fixSuccessful: boolean
  error?: Error
}
```

### Binary Validation Result
```typescript
type BinaryValidationResult = {
  binaryName: string
  path: string
  exists: boolean
  isExecutable: boolean
  permissions: string
  needsFix: boolean
}
```

## Error Handling

### Permission Errors
- **EACCES**: Permissions insuffisantes pour modifier les permissions
- **ENOENT**: Fichier binaire non trouvé
- **EPERM**: Opération non autorisée (nécessite sudo)

### Recovery Strategies
1. **Automatic Fix**: Tentative automatique de correction avec `fs.chmod()`
2. **User Notification**: Instructions claires si la correction automatique échoue
3. **Fallback Mode**: Mode dégradé avec instructions manuelles

### Error Messages
```typescript
const ERROR_MESSAGES = {
  BINARY_NOT_FOUND: 'Binaire ADB non trouvé à l\'emplacement: {path}',
  PERMISSION_DENIED: 'Permissions insuffisantes pour corriger les permissions ADB',
  FIX_FAILED: 'Impossible de corriger automatiquement les permissions ADB',
  MANUAL_FIX_REQUIRED: 'Correction manuelle requise. Exécutez: chmod +x {path}'
}
```

## Testing Strategy

### Unit Tests
1. **Permission Checker Tests**
   - Test de détection des permissions incorrectes
   - Test de correction automatique des permissions
   - Test de gestion des erreurs de permissions

2. **Path Resolution Tests**
   - Test de résolution des chemins en mode dev vs production
   - Test de validation des chemins ADB
   - Test de fallback en cas d'échec

### Integration Tests
1. **End-to-End ADB Tests**
   - Test complet du flux ADB sur macOS simulé
   - Test de récupération après correction des permissions
   - Test de fonctionnalités ADB (devices, shell, call, sms)

### Platform-Specific Tests
1. **macOS Specific Tests**
   - Test avec différents états de permissions
   - Test de correction automatique
   - Test de messages d'erreur utilisateur

### Manual Testing Scenarios
1. **Fresh Installation Test**
   - Installer l'app sur macOS propre
   - Vérifier que ADB fonctionne immédiatement

2. **Permission Corruption Test**
   - Corrompre manuellement les permissions
   - Redémarrer l'app et vérifier la correction automatique

## Implementation Details

### Electron Builder Configuration
```json
"mac": {
  "extraResources": [
    {
      "from": "platform-tools-latest-darwin (2)/platform-tools",
      "to": "platform-tools",
      "filter": ["**/*"]
    }
  ],
  "afterPack": "scripts/fix-macos-permissions.js"
}
```

### Permission Checking Logic
```typescript
// Vérification des permissions au démarrage
const checkAdbPermissions = async (adbPath: string): Promise<boolean> => {
  try {
    await fs.access(adbPath, fs.constants.F_OK | fs.constants.X_OK)
    return true
  } catch (error) {
    console.log('ADB permissions need fixing:', adbPath)
    return await fixAdbPermissions(adbPath)
  }
}
```

### Startup Integration
```typescript
// Dans createWindow(), après la création de la fenêtre
app.whenReady().then(async () => {
  // ... existing code ...
  
  // Vérifier et corriger les permissions ADB sur macOS
  if (process.platform === 'darwin') {
    await validateAndFixAdbPermissions()
  }
  
  mainWindow = createWindow()
  // ... rest of the code ...
})
```

## Security Considerations

1. **Permission Elevation**: Ne pas demander de privilèges root automatiquement
2. **Path Validation**: Valider tous les chemins pour éviter les attaques de traversée
3. **Error Logging**: Ne pas logger d'informations sensibles sur les chemins système
4. **User Consent**: Informer l'utilisateur des modifications de permissions

## Performance Considerations

1. **Lazy Loading**: Vérifier les permissions seulement quand ADB est utilisé
2. **Caching**: Mettre en cache le résultat de la vérification des permissions
3. **Async Operations**: Toutes les opérations de fichiers en mode asynchrone
4. **Minimal Impact**: Vérification rapide au démarrage sans bloquer l'UI