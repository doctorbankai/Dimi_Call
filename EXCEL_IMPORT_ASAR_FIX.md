# Fix: Erreur d'import Excel en production (Failed to fetch dynamically imported module)

## Problème

Certains utilisateurs rencontraient l'erreur suivante lors de l'import de fichiers Excel en production :

```
Failed to fetch dynamically imported module: file:///C:/Users/.../app.asar/dist/renderer/services/dataService
```

## Cause

Le problème était causé par le **code splitting automatique de Vite** qui créait des chunks dynamiques. En production Electron, ces modules sont empaquetés dans un fichier `.asar`, et les imports dynamiques échouent car les chemins de fichiers ne sont pas résolus correctement.

## Solution

Désactivation du code splitting automatique dans `electron.vite.config.ts` en ajoutant `manualChunks: undefined` dans les options de build Rollup.

### Modification apportée

```typescript
renderer: {
  root: 'src',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      output: {
        manualChunks: undefined, // Désactive le code splitting automatique
      }
    }
  },
  // ...
}
```

## Impact

- ✅ Les imports de modules fonctionnent maintenant correctement en production
- ✅ L'import de fichiers Excel fonctionne pour tous les utilisateurs
- ⚠️ Le bundle JavaScript sera légèrement plus gros (tous les modules dans un seul fichier)
- ✅ Pas d'impact sur les performances de l'application

## Test

Pour tester la correction :

1. Rebuild l'application : `npm run build`
2. Créer un package de distribution : `npm run dist:win`
3. Installer et lancer l'application
4. Tester l'import d'un fichier Excel

## Note technique

Cette solution est préférable à `asarUnpack` car :
- Plus simple à maintenir
- Pas de problèmes de chemins de fichiers
- Fonctionne sur toutes les plateformes (Windows, Mac, Linux)
