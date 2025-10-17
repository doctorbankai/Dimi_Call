# Correction de la Persistance de la Visibilité des Colonnes - Page Appels

## Problème Identifié

Dans la page "Appels" en mode Table, lorsque l'utilisateur masquait certaines colonnes puis naviguait vers d'autres onglets (comme "Calendrier") et revenait sur "Appels", les colonnes masquées réapparaissaient. Les préférences de visibilité n'étaient pas conservées.

## Cause du Problème

Le problème avait **deux causes principales** :

1. **Réinitialisation lors du changement de page** : La fonction `detectAvailableColumns` était appelée à chaque changement de l'état `contacts` (via `useEffect`). Quand l'utilisateur changeait de page, cette fonction était appelée et réinitialisait l'état `visibleColumns` en écrasant les préférences utilisateur.

2. **Réinitialisation quand pas de contacts** : Quand `contactsData.length === 0` (ce qui peut arriver temporairement lors du changement de page), la fonction réinitialisait complètement `visibleColumns` avec les valeurs par défaut, perdant ainsi toutes les préférences utilisateur.

### Flux problématique :
1. L'utilisateur masque des colonnes → `visibleColumns` est mis à jour → sauvegardé dans localStorage ✅
2. L'utilisateur change d'onglet → le composant reste monté
3. L'utilisateur revient sur "Appels" → `useEffect` détecte un changement dans `contacts`
4. `detectAvailableColumns` est appelé → réinitialise `visibleColumns` ❌
5. Les préférences utilisateur sont perdues

## Solution Implémentée

### 1. Protection contre la réinitialisation quand pas de contacts

Modification du cas `contactsData.length === 0` pour **ne jamais écraser** les préférences existantes :

```typescript
if (!contactsData || contactsData.length === 0) {
  // ... définition des colonnes par défaut ...
  
  setVisibleColumns(prevVisible => {
    // Si on a déjà des préférences, les garder
    if (Object.keys(prevVisible).length > 0) {
      console.log('✅ Préférences existantes conservées (pas de contacts):', prevVisible);
      return prevVisible; // ← GARDER LES PRÉFÉRENCES
    }
    
    // Sinon, initialiser avec les valeurs par défaut (première fois uniquement)
    const defaultVisibility = defaultColumns.reduce((acc, col) => {
      acc[col] = true;
      return acc;
    }, {} as Record<string, boolean>);
    return defaultVisibility;
  });
  return;
}
```

### 2. Modification de la logique de mise à jour dans `detectAvailableColumns`

La fonction a été modifiée pour :
- **Préserver les préférences existantes** : Si l'utilisateur a déjà des préférences sauvegardées, elles sont conservées
- **Fusionner intelligemment** : Seules les nouvelles colonnes détectées sont ajoutées avec leurs valeurs par défaut
- **Ne pas écraser** : Les colonnes existantes gardent leur état de visibilité

### 3. Ajout de logs de débogage

Pour faciliter le diagnostic des problèmes futurs, des logs ont été ajoutés :
- Chargement initial depuis localStorage
- Sauvegarde dans localStorage
- Appels à `detectAvailableColumns`
- Conservation ou réinitialisation des préférences

```typescript
setVisibleColumns(prevVisible => {
  // Si les colonnes sont déjà initialisées et qu'on a des préférences sauvegardées,
  // ne pas les écraser
  const hasExistingPreferences = Object.keys(prevVisible).length > 0;
  
  const newVisibleColumns = newAvailableColumns.reduce((acc, col) => {
    // Garder la préférence existante si elle existe, sinon true par défaut
    acc[col] = prevVisible[col] !== undefined ? prevVisible[col] : true;
    return acc;
  }, {} as Record<string, boolean>);

  // Masquer par défaut certaines colonnes moins importantes (seulement si pas déjà défini)
  const lessImportantColumns = ["Don", "Qualité", "Type", "Date", "UID"];
  lessImportantColumns.forEach(col => {
    if (newVisibleColumns[col] !== undefined && prevVisible[col] === undefined) {
      newVisibleColumns[col] = false;
    }
  });

  // Si on a déjà des préférences, ne retourner les nouvelles valeurs que pour les nouvelles colonnes
  if (hasExistingPreferences) {
    const merged = { ...prevVisible };
    // Ajouter uniquement les nouvelles colonnes détectées
    newAvailableColumns.forEach(col => {
      if (merged[col] === undefined) {
        merged[col] = newVisibleColumns[col];
      }
    });
    return merged;
  }

  return newVisibleColumns;
});
```

## Comportement Après Correction

### Scénario 1 : Première utilisation
1. L'utilisateur ouvre la page "Appels"
2. Les colonnes sont détectées et affichées avec les valeurs par défaut
3. Les colonnes moins importantes (Don, Qualité, Type, Date, UID) sont masquées par défaut

### Scénario 2 : Modification de la visibilité
1. L'utilisateur masque/affiche des colonnes via le menu "Gestion des colonnes"
2. Les préférences sont sauvegardées dans localStorage
3. L'utilisateur change d'onglet puis revient
4. ✅ **Les préférences sont conservées** - les colonnes restent dans l'état choisi

### Scénario 3 : Nouvelles colonnes détectées
1. L'utilisateur importe de nouvelles données avec des colonnes supplémentaires
2. Les nouvelles colonnes sont ajoutées avec leur valeur par défaut
3. Les colonnes existantes conservent leur état de visibilité

## Fichiers Modifiés

- ✅ `src/App.tsx` - Correction de la fonction `detectAvailableColumns` et ajout de `columnsInitializedRef`

## Test de la Correction

Pour vérifier que la correction fonctionne :

1. Ouvrir la page "Appels" en mode Table
2. Ouvrir la console du navigateur (F12) pour voir les logs
3. Cliquer sur le bouton "Gestion des colonnes" (⚙️)
4. Masquer plusieurs colonnes (par exemple : Sexe, Source, Type, Qualité)
5. Vérifier dans la console : `💾 Sauvegarde visibleColumns dans localStorage`
6. Naviguer vers un autre onglet (Calendrier, Annuaire, Paramètres, etc.)
7. Revenir sur l'onglet "Appels"
8. Vérifier dans la console : `✅ Préférences existantes conservées`
9. ✅ Vérifier que les colonnes masquées restent masquées
10. Ouvrir à nouveau le menu "Gestion des colonnes"
11. ✅ Vérifier que les cases à cocher reflètent l'état correct

### Logs attendus dans la console

**Au chargement initial :**
```
🔍 Chargement initial visibleColumns depuis localStorage: {...}
🔎 detectAvailableColumns appelé avec X contacts
```

**Lors du masquage d'une colonne :**
```
🔧 App.tsx - Toggle column visibility: {...}
💾 Sauvegarde visibleColumns dans localStorage: {...}
```

**Lors du retour sur la page Appels :**
```
🔎 detectAvailableColumns appelé avec X contacts
✅ Préférences existantes conservées et fusionnées: {...}
```

## Avantages de la Solution

- ✅ **Persistance garantie** : Les préférences utilisateur sont toujours conservées
- ✅ **Pas de régression** : Le système de détection automatique des colonnes continue de fonctionner
- ✅ **Extensibilité** : Les nouvelles colonnes sont automatiquement ajoutées sans écraser les préférences
- ✅ **Performance** : Pas d'impact sur les performances, la logique reste efficace
