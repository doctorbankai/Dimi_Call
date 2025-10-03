# Design Document

## Overview

Ce document décrit la solution technique pour corriger le bug d'exclusion des numéros détectés dans Supabase lors de l'import de contacts. Le problème actuel est que le composant `ImportMappingDialog` ne transmet pas correctement les numéros à exclure à la fonction `importContactsFromFile`, même si l'interface utilisateur indique que les lignes seront supprimées.

## Architecture

### Flux de données actuel (bugué)

```
ImportMappingDialog
  ↓ (filterMode === 'remove')
  ↓ applyFilter('remove') → setRemovedPhones(phoneWarnings.normalized)
  ↓ onConfirm(mapping, options)
  ↓ options = filterMode === 'remove' ? { phonesToRemove: supabaseMatchesSet } : {}
  ↓ BUG: supabaseMatchesSet contient les numéros, mais options est construit AVANT le clic
  ↓
ContactTable.onConfirm
  ↓ importContactsFromFile(file, mapping, options)
  ↓ options.phonesToRemove = [] (vide!)
  ↓
dataService.importContactsFromFile
  ↓ phonesToExclude = new Set([]) (vide!)
  ↓ Aucune ligne n'est filtrée
```

### Flux de données corrigé

```
ImportMappingDialog
  ↓ (filterMode === 'remove')
  ↓ applyFilter('remove') → setRemovedPhones(phoneWarnings.normalized)
  ↓ onConfirm(mapping, options)
  ↓ options = filterMode === 'remove' ? { phonesToRemove: removedPhones } : {}
  ↓ removedPhones contient les numéros normalisés stockés dans l'état
  ↓
ContactTable.onConfirm
  ↓ importContactsFromFile(file, mapping, options)
  ↓ options.phonesToRemove = [...numéros normalisés]
  ↓
dataService.importContactsFromFile
  ↓ phonesToExclude = new Set([...numéros normalisés])
  ↓ Les lignes correspondantes sont filtrées
```

## Components and Interfaces

### ImportMappingDialog.tsx

**État actuel problématique:**
```typescript
const [removedPhones, setRemovedPhones] = useState<string[]>([])
const supabaseMatchesSet = useMemo(() => new Set(phoneWarnings.normalized), [phoneWarnings.normalized])

// Dans le bouton Importer:
onClick={() => {
  const normalizedPhones = Array.from(supabaseMatchesSet)
  const options = filterMode === 'remove'
    ? { phonesToRemove: normalizedPhones }
    : {}
  onConfirm(mapping, options)
}}
```

**Problème:** `supabaseMatchesSet` est recalculé à partir de `phoneWarnings.normalized` qui contient TOUS les numéros détectés, pas seulement ceux que l'utilisateur a choisi d'exclure. De plus, si l'utilisateur clique sur "Réinitialiser", `filterMode` redevient 'none' mais `supabaseMatchesSet` contient toujours les numéros.

**Solution:**
```typescript
// Utiliser removedPhones qui est mis à jour par applyFilter('remove')
onClick={() => {
  const options = filterMode === 'remove' && removedPhones.length > 0
    ? { phonesToRemove: removedPhones }
    : {}
  console.log('[ImportMappingDialog] 🚀 Validation import', { 
    filterMode, 
    removedPhones, 
    options 
  })
  onConfirm(mapping, options)
}}
```

### dataService.ts

**État actuel (déjà correct):**
```typescript
const rawPhonesToRemove = options?.phonesToRemove || []
const normalizedPhones = rawPhonesToRemove.map(normalizePhoneNumber).filter(Boolean) as string[]
const phonesToExclude = new Set(normalizedPhones)
console.log('[importContactsFromFile] 🔍 Exclusion de numéros normalisés', { 
  bruts: rawPhonesToRemove, 
  normalisés: normalizedPhones 
})

// Plus tard dans le code CSV/TSV:
if (normalizedPhone && phonesToExclude.has(normalizedPhone)) {
  console.log('[importContactsFromFile] 🚫 Ligne supprimée (CSV/TSV)', {
    numeroOriginal: contactData.telephone,
    numeroNormalise: normalizedPhone,
    ligne: rowIndex
  })
  return null
}

// Et dans le code Excel:
if (normalizedPhone && phonesToExclude.has(normalizedPhone)) {
  console.log('[importContactsFromFile] 🚫 Ligne supprimée (Excel)', {
    numeroOriginal: contactData.telephone,
    numeroNormalise: normalizedPhone,
    ligne: i + j
  })
  shouldSkip = true
}
```

**Aucune modification nécessaire** - Le code de filtrage fonctionne correctement, il reçoit juste un array vide actuellement.

## Data Models

Aucune modification des modèles de données n'est nécessaire. Les interfaces existantes sont correctes:

```typescript
interface ImportMappingDialogProps {
  // ...
  onConfirm: (mapping: Record<string, string>, options: { phonesToRemove?: string[] }) => void
  onRemovedPhonesChange?: (phones: string[]) => void
}
```

## Error Handling

### Cas limites à gérer

1. **L'utilisateur clique sur "Supprimer" puis "Réinitialiser" puis "Importer"**
   - Solution: Vérifier que `filterMode === 'remove'` ET `removedPhones.length > 0`

2. **L'utilisateur clique sur "Voir uniquement" puis "Importer"**
   - Solution: Ne pas passer `phonesToRemove` si `filterMode === 'isolate'`

3. **Les numéros sont déjà normalisés dans removedPhones**
   - Solution: Pas besoin de re-normaliser dans `dataService.ts`, mais le faire quand même par sécurité

## Testing Strategy

### Tests manuels

1. **Test du flux complet d'exclusion:**
   - Importer un fichier avec des numéros déjà dans Supabase
   - Vérifier que la détection fonctionne (affichage du warning)
   - Cliquer sur "Supprimer les lignes détectées"
   - Vérifier que l'aperçu est mis à jour
   - Cliquer sur "Importer"
   - Vérifier dans les logs que `options.phonesToRemove` contient les numéros
   - Vérifier que les lignes sont effectivement supprimées (logs `🚫 Ligne supprimée`)
   - Vérifier que la table finale ne contient pas ces contacts

2. **Test de réinitialisation:**
   - Importer un fichier avec des numéros déjà dans Supabase
   - Cliquer sur "Supprimer les lignes détectées"
   - Cliquer sur "Réinitialiser"
   - Cliquer sur "Importer"
   - Vérifier que TOUS les contacts sont importés (aucune exclusion)

3. **Test du mode "Voir uniquement":**
   - Importer un fichier avec des numéros déjà dans Supabase
   - Cliquer sur "Voir uniquement les lignes détectées"
   - Cliquer sur "Importer"
   - Vérifier que TOUS les contacts sont importés (pas d'exclusion en mode isolate)

### Logs à vérifier

```
[ImportMappingDialog] 🚀 Validation import { filterMode: 'remove', removedPhones: [...], options: { phonesToRemove: [...] } }
[importContactsFromFile] 🔍 Exclusion de numéros normalisés { bruts: [...], normalisés: [...] }
[importContactsFromFile] 🚫 Ligne supprimée (Excel/CSV) { numeroOriginal: '...', numeroNormalise: '...', ligne: X }
📥 [MAPPING] X contacts importés (après exclusion éventuelle)
```

## Implementation Notes

### Changement minimal requis

Le fix est très simple et ne nécessite qu'une seule modification dans `ImportMappingDialog.tsx`:

**Ligne à modifier (environ ligne 585):**
```typescript
// AVANT (bugué):
const normalizedPhones = Array.from(supabaseMatchesSet)
const options = filterMode === 'remove'
  ? { phonesToRemove: normalizedPhones }
  : {}

// APRÈS (corrigé):
const options = filterMode === 'remove' && removedPhones.length > 0
  ? { phonesToRemove: removedPhones }
  : {}
```

### Pourquoi cette solution fonctionne

1. `removedPhones` est mis à jour par `applyFilter('remove')` qui appelle `setRemovedPhones(phoneWarnings.normalized)`
2. `removedPhones` est réinitialisé à `[]` par `resetFilter()` quand l'utilisateur clique sur "Réinitialiser"
3. `removedPhones` contient déjà les numéros normalisés (pas besoin de re-normaliser)
4. La condition `filterMode === 'remove' && removedPhones.length > 0` garantit qu'on ne passe `phonesToRemove` que si l'utilisateur a explicitement demandé la suppression ET qu'il y a des numéros à supprimer

### Amélioration du logging

Ajouter un log plus détaillé dans le bouton "Importer" pour faciliter le débogage:

```typescript
console.log('[ImportMappingDialog] 🚀 Validation import', { 
  filterMode, 
  removedPhones, 
  removedPhonesCount: removedPhones.length,
  options 
})
```
