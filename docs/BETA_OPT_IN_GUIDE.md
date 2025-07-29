# Guide d'utilisation - Beta Opt-in et DevTools

## Vue d'ensemble

La fonctionnalité Beta Opt-in permet aux utilisateurs de DimiCall de :
- ✅ Opter pour recevoir les versions bêta (pre-releases)
- ✅ Activer/désactiver manuellement les outils de développement (DevTools)
- ✅ Revenir facilement aux versions stables
- ✅ Voir clairement quand ils utilisent une version bêta

## Interface utilisateur

### Accès aux paramètres

1. **Ouvrir les paramètres** : Cliquez sur l'icône ⚙️ dans la barre de titre
2. **Naviguer vers "Mises à jour"** : Sélectionnez l'onglet "Mises à jour" dans le menu latéral
3. **Localiser les options** : Vous verrez deux sections principales :
   - **Version actuelle** : Informations sur la version installée
   - **Versions bêta** : Options pour les versions de test
   - **Outils de développement** : Contrôle des DevTools

### Section Versions bêta

#### Activation des versions bêta

1. **Première activation** :
   - Cochez "Recevoir les versions bêta"
   - Un dialog d'avertissement s'affiche avec les informations importantes
   - Lisez attentivement les implications
   - Cliquez sur "J'accepte, activer les versions bêta"

2. **Activations suivantes** :
   - La checkbox peut être cochée/décochée directement
   - Pas de dialog d'avertissement (vous avez déjà été averti)

#### Informations affichées quand les versions bêta sont activées

- ✅ Badge "BETA" à côté du titre
- ✅ Informations détaillées sur les implications :
  - Nouvelles fonctionnalités en test
  - Mises à jour plus fréquentes
  - Possibilité de bugs ou d'instabilités

#### Retour aux versions stables

- **Bouton disponible** : "Revenir à la version stable" (si version bêta active)
- **Processus** :
  1. Cliquez sur le bouton
  2. Confirmez dans le dialog qui s'affiche
  3. L'application télécharge la dernière version stable
  4. Redémarrage automatique

### Section Outils de développement

#### Activation/Désactivation

- **Checkbox simple** : "Activer les outils de développement (Ctrl+Shift+I)"
- **Effet immédiat** : Les DevTools sont activés/désactivés instantanément
- **Persistance** : L'état est sauvegardé et restauré au redémarrage

#### Informations affichées quand les DevTools sont activés

- ✅ Accès à la console de développement
- ✅ Inspection des éléments et du DOM
- ✅ Débogage JavaScript et analyse des performances
- ✅ Utile pour reporter des bugs et analyser les problèmes

## Indicateurs visuels

### Badge BETA dans la barre de titre

- **Quand affiché** : Lorsque l'utilisateur a activé les versions bêta
- **Apparence** : Badge orange avec icône 🧪 et texte "BETA"
- **Emplacement** : À côté du nom "DimiCall" dans la barre de titre

### Badge BETA dans les dialogs de mise à jour

- **Quand affiché** : Lors de l'installation d'une version bêta
- **Apparence** : Badge orange "BETA" à côté de la version

## Stockage des données

### Clés localStorage utilisées

```javascript
// Préférences bêta
'dimicall-beta-preferences' = {
  enabled: boolean,
  lastModified: number,
  hasBeenWarned: boolean
}

// Type de version actuelle
'dimicall-version-type' = 'stable' | 'beta'

// État des DevTools
'dimicall-devtools-enabled' = 'true' | 'false'
```

### Gestion des données

- **Validation automatique** : Les données corrompues sont automatiquement réinitialisées
- **Migration** : Les anciennes versions de préférences sont automatiquement migrées
- **Nettoyage** : Les données obsolètes sont supprimées automatiquement

## Workflow utilisateur typique

### Première utilisation des versions bêta

1. **Ouverture des paramètres** → Mises à jour
2. **Activation** → Cocher "Recevoir les versions bêta"
3. **Lecture de l'avertissement** → Dialog avec informations importantes
4. **Confirmation** → "J'accepte, activer les versions bêta"
5. **Résultat** :
   - Badge "BETA" affiché dans la barre de titre
   - Informations détaillées visibles dans les paramètres
   - Prochaines mises à jour incluront les pre-releases

### Activation des DevTools

1. **Ouverture des paramètres** → Mises à jour
2. **Activation** → Cocher "Activer les outils de développement"
3. **Résultat immédiat** :
   - DevTools disponibles avec Ctrl+Shift+I
   - Informations détaillées visibles dans les paramètres
   - État persistant au redémarrage

### Retour aux versions stables

1. **Ouverture des paramètres** → Mises à jour
2. **Retour** → Cliquer "Revenir à la version stable"
3. **Confirmation** → Dialog avec détails du processus
4. **Processus automatique** :
   - Téléchargement de la dernière version stable
   - Redémarrage de l'application
   - Badge "BETA" supprimé
   - DevTools peuvent rester activés selon les préférences

## Sécurité et bonnes pratiques

### Pour les utilisateurs

- ✅ **Sauvegardez vos données** avant d'activer les versions bêta
- ✅ **Signalez les bugs** via les DevTools si vous en rencontrez
- ✅ **Utilisez en environnement de test** si possible pour les versions bêta
- ✅ **Revenez aux versions stables** si vous rencontrez des problèmes

### Pour les développeurs

- ✅ **Validation des données** : Toutes les préférences sont validées
- ✅ **Gestion d'erreurs** : Fallback gracieux en cas de problème
- ✅ **Logs détaillés** : Toutes les actions sont loggées pour le débogage
- ✅ **Tests complets** : Couverture de test étendue

## Dépannage

### Problèmes courants

#### Les DevTools ne s'activent pas

1. **Vérifier l'API Electron** : Les méthodes `enableDevTools`/`disableDevTools` doivent être implémentées
2. **Vérifier les logs** : Consulter la console pour les messages d'erreur
3. **Réinitialiser les préférences** : Supprimer la clé `dimicall-devtools-enabled` du localStorage

#### Les préférences bêta ne se sauvegardent pas

1. **Vérifier localStorage** : S'assurer que localStorage est disponible
2. **Vérifier les permissions** : L'application doit pouvoir écrire dans localStorage
3. **Réinitialiser** : Supprimer toutes les clés `dimicall-*` du localStorage

#### Le badge BETA ne s'affiche pas

1. **Vérifier l'état** : S'assurer que les versions bêta sont activées
2. **Redémarrer** : Redémarrer l'application
3. **Vérifier les données** : Contrôler le contenu de `dimicall-beta-preferences`

### Réinitialisation complète

```javascript
// Dans la console DevTools
localStorage.removeItem('dimicall-beta-preferences');
localStorage.removeItem('dimicall-version-type');
localStorage.removeItem('dimicall-devtools-enabled');
// Puis redémarrer l'application
```

## API pour les développeurs

### BetaPreferencesService

```typescript
// Récupérer les préférences
const prefs = BetaPreferencesService.getBetaPreferences();

// Sauvegarder les préférences
BetaPreferencesService.setBetaPreferences({
  enabled: true,
  lastModified: Date.now(),
  hasBeenWarned: true
});

// Vérifier si version bêta
const isBeta = BetaPreferencesService.isCurrentVersionBeta();
```

### DevToolsService

```typescript
// Vérifier l'état
const enabled = DevToolsService.isEnabled();

// Activer/Désactiver
DevToolsService.enableDevTools();
DevToolsService.disableDevTools();

// Toggle
DevToolsService.toggleDevTools();
```

## Conclusion

Cette fonctionnalité offre une expérience utilisateur complète et sécurisée pour :
- Tester les nouvelles fonctionnalités en avant-première
- Déboguer et analyser l'application
- Contrôler finement les outils de développement
- Revenir facilement aux versions stables

L'implémentation est robuste, testée et prête pour la production.