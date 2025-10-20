# Solution complète : Normalisation des numéros de téléphone

## 🎯 Problème résolu

**Symptôme initial :** Lors de l'import d'une base de données contenant le numéro `695905812`, aucune alerte n'était déclenchée alors que le numéro `+33 6 95 90 58 12` était bien présent dans la liste noire Supabase.

**Cause :** La fonction `normalizePhoneNumber()` était appelée dans le code mais n'existait pas, empêchant toute normalisation et comparaison des formats.

## ✅ Solution implémentée

### 1. Création de la fonction de normalisation

**Fichier :** `src/services/phoneUtils.ts`

La fonction `normalizePhoneNumber()` convertit tous les formats de numéros français vers le format international normalisé : `+33XXXXXXXXX` (sans espaces).

**Formats supportés :**
- `695905812` → `+33695905812`
- `06 95 90 58 12` → `+33695905812`
- `+33 6 95 90 58 12` → `+33695905812`
- `0695905812` → `+33695905812`
- `+330695905812` → `+33695905812`
- `33695905812` → `+33695905812`
- `0033695905812` → `+33695905812`
- `06.95.90.58.12` → `+33695905812`
- `06-95-90-58-12` → `+33695905812`
- `(0)6 95 90 58 12` → `+33695905812`

### 2. Intégration dans le processus d'import

**Fichier :** `src/services/dataService.ts`

La fonction est maintenant utilisée lors de l'import pour :
1. Normaliser chaque numéro importé
2. Le comparer avec les numéros normalisés dans Supabase
3. Détecter les doublons et les numéros en liste noire

### 3. Affichage des alertes

**Fichier :** `src/components/ImportMappingDialog.tsx`

Le composant affiche maintenant correctement :
- Le nombre de numéros détectés dans la liste noire
- Le nombre de numéros déjà présents (doublons)
- Les détails de chaque numéro détecté
- Les options pour supprimer ou isoler les lignes concernées

## 📊 Architecture de la solution

```
┌─────────────────────────────────────────────────────────────┐
│                    Import de fichier                         │
│                  (CSV, TSV, Excel)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Extraction des numéros                          │
│         extractPhoneCandidates(value)                        │
│    Détecte tous les formats possibles dans une cellule      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Normalisation des numéros                       │
│         normalizePhoneNumber(phoneStr)                       │
│    Convertit vers le format +33XXXXXXXXX                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Comparaison avec Supabase                            │
│    SELECT * FROM shared_blacklist_numbers                    │
│    WHERE normalized_phone IN (...)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Affichage des résultats                         │
│    - Alerte "Vérification Supabase"                         │
│    - Nombre de numéros détectés                             │
│    - Options de filtrage                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Données Supabase

### Structure des tables

**Table : `shared_blacklist_numbers`**
```sql
CREATE TABLE shared_blacklist_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,           -- Format affiché : "+33 6 95 90 58 12"
  normalized_phone TEXT NOT NULL,       -- Format normalisé : "+33695905812"
  prenom TEXT,
  nom TEXT,
  source TEXT,
  inserted_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
```

**Table : `shared_phone_numbers`**
```sql
CREATE TABLE shared_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,           -- Format affiché : "+33 6 95 90 58 12"
  normalized_phone TEXT NOT NULL,       -- Format normalisé : "+33695905812"
  prenom TEXT,
  nom TEXT,
  source TEXT,
  inserted_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
```

### Exemple de données

```sql
SELECT phone_number, normalized_phone, prenom, nom 
FROM shared_blacklist_numbers 
LIMIT 3;
```

| phone_number | normalized_phone | prenom | nom |
|--------------|------------------|--------|-----|
| +33 6 95 90 58 12 | +33695905812 | Trg | Kacz |
| +33 7 56 92 64 26 | +33756926426 | Guillaume Fricker - Avocat | NULL |
| +33 6 59 35 91 44 | +33659359144 | Kévin | Huron |

## 🧪 Tests disponibles

### 1. Test unitaire de la fonction
**Fichier :** `test-phone-normalization.html`

Ouvrir dans un navigateur pour tester 15 cas différents de normalisation.

### 2. Fichier de test d'import
**Fichier :** `test-import-phone-formats.csv`

Contient 13 lignes avec le même numéro sous différents formats + 2 numéros différents.

**Résultat attendu :**
- 11 lignes détectées en liste noire (même numéro sous différents formats)
- 2 lignes non détectées (numéros différents)

### 3. Guide de test complet
**Fichier :** `TEST_PHONE_NORMALIZATION_GUIDE.md`

Instructions détaillées pour tester tous les scénarios.

## 📝 Fichiers modifiés

1. **`src/services/phoneUtils.ts`**
   - ✅ Ajout de `normalizePhoneNumber()`
   - ✅ Documentation complète
   - ✅ Gestion de tous les formats français

2. **`src/services/dataService.ts`**
   - ✅ Import de `normalizePhoneNumber` depuis `phoneUtils`
   - ✅ Export pour compatibilité avec les imports existants
   - ✅ Utilisation dans `importContactsFromFile()`

3. **`src/components/ImportMappingDialog.tsx`**
   - ✅ Utilise déjà `normalizePhoneNumber` (import existant)
   - ✅ Affichage des alertes fonctionnel
   - ✅ Filtrage des lignes détectées

## 🎬 Démonstration

### Avant la correction

```
Import de : 695905812
Supabase : +33695905812
Résultat : ❌ Aucune alerte (formats incompatibles)
```

### Après la correction

```
Import de : 695905812
Normalisation : +33695905812
Supabase : +33695905812
Résultat : ✅ Alerte déclenchée (formats identiques)
```

## 🔧 Maintenance

### Ajouter un nouveau format

Si un nouveau format de numéro doit être supporté, modifier la fonction `normalizePhoneNumber()` dans `src/services/phoneUtils.ts` :

```typescript
// Nouveau cas : format spécial
if (cleaned.match(/^PATTERN$/)) {
  // Logique de normalisation
  return `+33${digits}`;
}
```

### Ajouter un numéro à la liste noire

```sql
INSERT INTO shared_blacklist_numbers (phone_number, normalized_phone, prenom, nom, source)
VALUES (
  '+33 6 12 34 56 78',           -- Format affiché
  '+33612345678',                 -- Format normalisé (IMPORTANT!)
  'Prénom',
  'Nom',
  'Source'
);
```

**⚠️ Important :** Toujours remplir `normalized_phone` avec le format `+33XXXXXXXXX` (sans espaces).

## 📈 Statistiques

- **Formats supportés :** 11+ formats différents
- **Tables Supabase :** 2 (blacklist + shared)
- **Numéros en liste noire :** 9 actuellement
- **Numéros partagés :** 266 actuellement

## 🚀 Prochaines étapes

1. ✅ Tester avec des fichiers réels
2. ✅ Vérifier les performances avec de gros fichiers
3. ✅ Documenter les cas d'usage
4. ⏳ Ajouter des tests automatisés (optionnel)
5. ⏳ Créer un script de migration pour normaliser les données existantes (optionnel)

## 📞 Support

En cas de problème :

1. Vérifier la connexion Supabase (icône verte)
2. Consulter la console (F12) pour les logs détaillés
3. Tester avec `test-phone-normalization.html`
4. Vérifier les données Supabase avec les requêtes SQL fournies

---

**Date de résolution :** 2025-01-20  
**Statut :** ✅ Résolu et testé  
**Impact :** Critique - Fonctionnalité essentielle pour éviter les doublons et respecter la liste noire
