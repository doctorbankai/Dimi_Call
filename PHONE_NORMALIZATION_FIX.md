# Fix: Normalisation des numéros de téléphone pour la vérification Supabase

## Problème identifié

Lors de l'import d'une base de données, les numéros de téléphone n'étaient pas détectés dans la liste noire Supabase, même s'ils y figuraient.

### Exemple du problème
- **Numéro importé**: `695905812` (sans préfixe)
- **Numéro dans Supabase**: `+33 6 95 90 58 12` (format affiché) / `+33695905812` (format normalisé)
- **Résultat**: ❌ Aucune alerte, car les formats n'étaient pas comparables

## Cause racine

La fonction `normalizePhoneNumber()` était utilisée dans le code mais **n'existait pas**, ce qui empêchait toute normalisation et comparaison des numéros.

## Solution implémentée

### 1. Création de la fonction `normalizePhoneNumber` dans `src/services/phoneUtils.ts`

La fonction convertit tous les formats de numéros français vers le format international normalisé : `+33XXXXXXXXX` (sans espaces).

**Formats supportés:**
- `695905812` → `+33695905812` ✅
- `06 95 90 58 12` → `+33695905812` ✅
- `+33 6 95 90 58 12` → `+33695905812` ✅
- `0695905812` → `+33695905812` ✅
- `+330695905812` → `+33695905812` ✅
- `33695905812` → `+33695905812` ✅
- `0033695905812` → `+33695905812` ✅

### 2. Export depuis `dataService.ts`

```typescript
// Re-export normalizePhoneNumber for backward compatibility
export { normalizePhoneNumber } from './phoneUtils';
```

### 3. Utilisation dans l'import

Lors de l'import de fichiers (CSV/Excel), chaque numéro de téléphone est maintenant:
1. **Normalisé** au format `+33XXXXXXXXX`
2. **Comparé** avec les numéros normalisés dans Supabase (`normalized_phone`)
3. **Détecté** s'il figure dans `shared_phone_numbers` ou `shared_blacklist_numbers`

## Vérification

### Données Supabase
```sql
SELECT phone_number, normalized_phone 
FROM shared_blacklist_numbers 
WHERE normalized_phone = '+33695905812';
```

**Résultat:**
| phone_number | normalized_phone |
|--------------|------------------|
| +33 6 95 90 58 12 | +33695905812 |

### Test de normalisation

```typescript
normalizePhoneNumber('695905812')        // → '+33695905812' ✅
normalizePhoneNumber('06 95 90 58 12')  // → '+33695905812' ✅
normalizePhoneNumber('+33695905812')    // → '+33695905812' ✅
```

## Impact

✅ **Avant**: Import de `695905812` → Aucune alerte (format incompatible)  
✅ **Après**: Import de `695905812` → Alerte détectée (numéro normalisé et comparé)

## Fichiers modifiés

1. `src/services/phoneUtils.ts` - Ajout de `normalizePhoneNumber()`
2. `src/services/dataService.ts` - Export et utilisation de la fonction
3. `src/components/ImportMappingDialog.tsx` - Utilise déjà la fonction (import existant)

## Recommandations

Pour garantir la cohérence des données:

1. **Lors de l'ajout manuel** de numéros dans Supabase, toujours remplir `normalized_phone` avec le format `+33XXXXXXXXX`
2. **Lors de l'import**, la normalisation est maintenant automatique
3. **Pour les recherches**, toujours utiliser `normalized_phone` pour les comparaisons

## Test manuel

1. Importer un fichier contenant le numéro `695905812`
2. Vérifier que l'alerte "Vérification Supabase" s'affiche
3. Confirmer que le numéro est détecté dans la liste noire
4. Vérifier que le filtre "Supprimer les lignes détectées" fonctionne

---

**Date**: 2025-01-20  
**Statut**: ✅ Résolu
