# Guide de test - Normalisation des numéros de téléphone

## 🎯 Objectif

Vérifier que les numéros de téléphone importés sont correctement normalisés et comparés avec la base Supabase, permettant ainsi la détection des numéros en liste noire ou déjà présents.

## 📋 Prérequis

1. Connexion Supabase active
2. Au moins un numéro dans `shared_blacklist_numbers` (ex: `+33 6 95 90 58 12`)
3. Fichier de test avec différents formats de numéros

## 🧪 Tests à effectuer

### Test 1: Vérification de la fonction de normalisation

Ouvrir le fichier `test-phone-normalization.html` dans un navigateur pour vérifier que tous les formats sont correctement normalisés.

**Résultat attendu:** Tous les tests doivent être verts ✅

### Test 2: Import avec numéro en liste noire (format sans préfixe)

1. Créer un fichier CSV/Excel avec une ligne contenant:
   ```
   Prénom,Nom,Téléphone
   Test,User,695905812
   ```

2. Importer le fichier dans l'application

3. **Résultat attendu:**
   - ✅ L'alerte "Vérification Supabase" s'affiche
   - ✅ Le message indique "1 numéro détecté dans la liste noire"
   - ✅ Le bouton "Voir les détails" affiche le numéro `+33695905812`

### Test 3: Import avec numéro en liste noire (format français)

1. Créer un fichier avec:
   ```
   Prénom,Nom,Téléphone
   Test,User,06 95 90 58 12
   ```

2. Importer le fichier

3. **Résultat attendu:**
   - ✅ Même comportement que Test 2
   - ✅ Le numéro est détecté malgré le format différent

### Test 4: Import avec numéro en liste noire (format international)

1. Créer un fichier avec:
   ```
   Prénom,Nom,Téléphone
   Test,User,+33 6 95 90 58 12
   ```

2. Importer le fichier

3. **Résultat attendu:**
   - ✅ Même comportement que Test 2
   - ✅ Le numéro est détecté

### Test 5: Suppression des lignes détectées

1. Importer un fichier contenant plusieurs lignes, dont une avec le numéro en liste noire

2. Dans le dialogue d'import, cliquer sur "Supprimer les lignes détectées"

3. **Résultat attendu:**
   - ✅ L'aperçu ne montre plus la ligne avec le numéro en liste noire
   - ✅ Le message indique "Les lignes détectées seront ignorées lors de l'import"
   - ✅ Après confirmation, la ligne n'est pas importée

### Test 6: Isolation des lignes détectées

1. Importer un fichier contenant plusieurs lignes, dont une avec le numéro en liste noire

2. Dans le dialogue d'import, cliquer sur "Isoler les lignes détectées"

3. **Résultat attendu:**
   - ✅ L'aperçu montre uniquement la ligne avec le numéro en liste noire
   - ✅ Le message indique "Affichage des seules lignes détectées"

### Test 7: Vérification dans la console

1. Ouvrir les DevTools (F12)

2. Importer un fichier avec le numéro `695905812`

3. **Résultat attendu dans la console:**
   ```
   [importContactsFromFile] 🔍 Exclusion de numéros normalisés
   {
     bruts: ["695905812"],
     brutsLength: 1,
     normalisés: ["+33695905812"],
     normalisésLength: 1
   }
   ```

## 🔍 Vérification dans Supabase

Pour vérifier que les données sont correctes dans Supabase:

```sql
-- Vérifier le format des numéros en liste noire
SELECT phone_number, normalized_phone 
FROM shared_blacklist_numbers 
LIMIT 10;

-- Vérifier un numéro spécifique
SELECT phone_number, normalized_phone 
FROM shared_blacklist_numbers 
WHERE normalized_phone = '+33695905812';
```

**Format attendu:**
- `phone_number`: Format affiché (ex: `+33 6 95 90 58 12`)
- `normalized_phone`: Format normalisé (ex: `+33695905812`)

## 📊 Fichier de test complet

Créer un fichier `test-import.csv` avec:

```csv
Prénom,Nom,Téléphone,Email
Jean,Dupont,695905812,jean@example.com
Marie,Martin,06 12 34 56 78,marie@example.com
Pierre,Durand,+33 6 95 90 58 12,pierre@example.com
Sophie,Bernard,0612345679,sophie@example.com
```

**Résultat attendu:**
- ✅ 2 numéros détectés en liste noire (lignes 1 et 3, même numéro sous différents formats)
- ✅ 2 numéros non détectés (lignes 2 et 4)

## ❌ Cas d'erreur à tester

### Erreur 1: Numéro invalide

```csv
Prénom,Nom,Téléphone
Test,User,abc123
```

**Résultat attendu:**
- ✅ Aucune erreur
- ✅ Le numéro est ignoré (normalisation retourne une chaîne vide)

### Erreur 2: Numéro trop court

```csv
Prénom,Nom,Téléphone
Test,User,123
```

**Résultat attendu:**
- ✅ Aucune erreur
- ✅ Le numéro est ignoré

## 🐛 Débogage

Si les tests échouent:

1. **Vérifier la connexion Supabase:**
   - L'icône de connexion doit être verte
   - Vérifier dans les DevTools: `supabaseService.isReady()` doit retourner `true`

2. **Vérifier les données Supabase:**
   - Exécuter les requêtes SQL ci-dessus
   - Vérifier que `normalized_phone` est bien rempli

3. **Vérifier la console:**
   - Rechercher les logs `[ImportMappingDialog]`
   - Vérifier les logs `[importContactsFromFile]`

4. **Vérifier la fonction de normalisation:**
   - Ouvrir `test-phone-normalization.html`
   - Tous les tests doivent être verts

## ✅ Checklist de validation

- [ ] Test 1: Fonction de normalisation (HTML)
- [ ] Test 2: Import format sans préfixe
- [ ] Test 3: Import format français
- [ ] Test 4: Import format international
- [ ] Test 5: Suppression des lignes
- [ ] Test 6: Isolation des lignes
- [ ] Test 7: Logs console
- [ ] Vérification Supabase
- [ ] Fichier de test complet
- [ ] Cas d'erreur

---

**Date**: 2025-01-20  
**Auteur**: Kiro AI  
**Statut**: ✅ Prêt pour les tests
