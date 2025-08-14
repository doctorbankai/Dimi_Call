# Système de Mise à Jour

## Vue d'ensemble

L'application DimiCall utilise un système de mise à jour adaptatif qui se comporte différemment selon la plateforme :

- **Windows & Linux** : Mises à jour automatiques complètes via electron-updater
- **macOS** : Mises à jour manuelles uniquement (pas de vérification automatique)

## Pourquoi macOS est différent ?

Sur macOS, les mises à jour automatiques nécessitent une signature de code et une notarisation Apple, ce qui implique des coûts supplémentaires. Pour éviter ces frais, les versions macOS (.dmg) désactivent complètement le système de mise à jour automatique.

## Configuration par Plateforme

### Windows & Linux
- ✅ Vérification automatique des mises à jour au démarrage
- ✅ Vérification automatique toutes les 10 minutes
- ✅ Téléchargement automatique en arrière-plan
- ✅ Installation sur demande de l'utilisateur
- ✅ Badge de mise à jour dans la titlebar
- ✅ Section mise à jour dans les paramètres

### macOS
- ❌ Aucune vérification automatique
- ❌ Aucun téléchargement automatique
- ❌ Pas de badge de mise à jour
- ❌ Pas de section mise à jour dans les paramètres
- ✅ Message informatif avec lien vers GitHub
- ✅ Instructions pour téléchargement manuel

## Variables d'Environnement

Le système utilise plusieurs variables d'environnement pour contrôler le comportement :

### `DISABLE_AUTO_UPDATES`
- **Valeur** : `"true"` ou `"false"`
- **Effet** : Force la désactivation des mises à jour sur toutes les plateformes
- **Usage** : Définie automatiquement à `"true"` pour les builds macOS dans GitHub Actions

### `FORCE_ENABLE_UPDATES`
- **Valeur** : `"true"` ou `"false"`
- **Effet** : Force l'activation des mises à jour même sur macOS
- **Usage** : Utile pour le développement local sur macOS

### `MANUAL_UPDATE_URL`
- **Valeur** : URL vers la page des releases
- **Effet** : Définit l'URL affichée pour les mises à jour manuelles
- **Défaut** : `https://github.com/doctorbankai/Dimi_Call/releases`

## Architecture Technique

### PlatformUpdateService
Service central qui :
- Détecte la plateforme d'exécution
- Lit les variables d'environnement
- Fournit la configuration de mise à jour
- Génère les informations de mise à jour manuelle

### useAutoUpdate Hook
Hook React qui :
- Utilise PlatformUpdateService pour la configuration
- Désactive les listeners d'événements si nécessaire
- Bloque les appels API de mise à jour sur macOS
- Fournit les informations de mise à jour manuelle

### Composants UI
- **TitleBar** : Masque le badge de mise à jour si désactivé
- **SettingsDialog** : Affiche soit les contrôles automatiques soit les infos manuelles

## Workflow de Build

### GitHub Actions
Le workflow `.github/workflows/release.yml` :

1. **Build Windows** : Variables d'environnement normales
2. **Build macOS** : 
   - `DISABLE_AUTO_UPDATES=true`
   - `MANUAL_UPDATE_URL=https://github.com/doctorbankai/Dimi_Call/releases`

### Electron Builder
La configuration dans `package.json` :
- Publie tous les builds sur GitHub
- Même configuration de publication pour toutes les plateformes
- La différenciation se fait au niveau applicatif, pas au niveau build

## Tests

### Tests Unitaires
- `PlatformUpdateService.test.ts` : Tests de détection de plateforme et configuration
- `useAutoUpdate.test.ts` : Tests du hook avec mises à jour activées/désactivées

### Tests d'Intégration
- Vérification du comportement sur chaque plateforme
- Tests des variables d'environnement
- Tests de l'interface utilisateur conditionnelle

## Développement Local

### Tester sur macOS avec mises à jour activées
```bash
FORCE_ENABLE_UPDATES=true npm run dev
```

### Tester avec mises à jour désactivées
```bash
DISABLE_AUTO_UPDATES=true npm run dev
```

### Tester avec URL personnalisée
```bash
DISABLE_AUTO_UPDATES=true MANUAL_UPDATE_URL=https://example.com/releases npm run dev
```

## Logs et Debug

Le système génère des logs détaillés :

```
[PlatformUpdateService] Configuration: {"enabled":false,"platform":"darwin","reason":"Updates disabled on macOS due to notarization requirements"}
[useAutoUpdate] Updates enabled: false
[TitleBar] Update badge hidden (updates disabled for this platform)
[SettingsDialog] Update enabled: false
```

Ces logs permettent de vérifier que la configuration est correcte sur chaque plateforme.