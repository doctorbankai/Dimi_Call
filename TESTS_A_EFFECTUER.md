# 🧪 Tests à Effectuer

## ✅ Tests Déjà Effectués

### Test 1 : Vérification de la Base de Données ✅

**Résultat** : 
- ✅ 22 utilisateurs dans la base
- ✅ 22/22 ont `aud = 'authenticated'`
- ✅ 22/22 ont `role = 'authenticated'`
- ✅ 22/22 ont une licence valide
- ✅ 22/22 ont leur email confirmé

**Échantillon vérifié** :
- raymond.reddington@dimicall.com ✅
- test2.test@gmail.com ✅
- test.test.test@gmail.com ✅

## 🔍 Tests à Effectuer par Vous

### Test 2 : Connexion avec Utilisateur Existant

**Objectif** : Vérifier que les utilisateurs existants peuvent se connecter

**Étapes** :
1. Ouvrez votre application DimiCall
2. Allez sur la page de login
3. Essayez de vous connecter avec un de vos utilisateurs :
   - Email : `raymond.reddington@dimicall.com` (ou un autre)
   - Mot de passe : (celui que vous connaissez)

**Résultat attendu** :
- ✅ La connexion devrait fonctionner immédiatement
- ✅ Vous devriez être redirigé vers l'application
- ✅ Aucune erreur de licence ou de configuration

**Si ça ne fonctionne pas** :
- Vérifiez les logs de la console (F12)
- Consultez [VERIFICATION_RAPIDE.md](VERIFICATION_RAPIDE.md)

---

### Test 3 : Créer un Nouvel Utilisateur (Dashboard)

**Objectif** : Vérifier que les nouveaux utilisateurs fonctionnent automatiquement

**Étapes** :
1. Allez sur https://supabase.com/dashboard
2. Naviguez vers **Authentication** → **Users**
3. Cliquez sur **"Add user"** → **"Create new user"**
4. Remplissez :
   - Email : `test.nouveau@exemple.com`
   - Password : `TestPassword123!`
   - ✅ Cochez **"Auto Confirm User"**
5. Cliquez sur **"Create user"**

**Résultat attendu** :
- ✅ L'utilisateur est créé
- ✅ Il apparaît dans la liste des utilisateurs

**Vérification SQL** (optionnel) :
```sql
SELECT 
  email,
  aud,
  role,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_app_meta_data->>'license_expires_at' as license
FROM auth.users
WHERE email = 'test.nouveau@exemple.com';
```

**Résultat attendu** :
- ✅ `aud = 'authenticated'`
- ✅ `role = 'authenticated'`
- ✅ `email_confirmed = true`
- ✅ `license` contient une date future

---

### Test 4 : Connexion avec le Nouvel Utilisateur

**Objectif** : Vérifier que le nouvel utilisateur peut se connecter immédiatement

**Étapes** :
1. Ouvrez votre application DimiCall
2. Allez sur la page de login
3. Connectez-vous avec :
   - Email : `test.nouveau@exemple.com`
   - Mot de passe : `TestPassword123!`

**Résultat attendu** :
- ✅ La connexion fonctionne immédiatement
- ✅ Aucune erreur
- ✅ Accès complet à l'application

---

### Test 5 : Vérification de la Licence

**Objectif** : Vérifier que la vérification de licence fonctionne

**Étapes** :
1. Connectez-vous avec n'importe quel utilisateur
2. Ouvrez la console du navigateur (F12)
3. Tapez :
```javascript
// Vérifier les informations de l'utilisateur
const { data: { user } } = await supabase.auth.getUser();
console.log('Licence:', user.app_metadata?.license_expires_at);
```

**Résultat attendu** :
- ✅ Une date de licence s'affiche (2026-11-20 ou similaire)
- ✅ La date est dans le futur

---

### Test 6 : Vérification Anti-Partage de Compte

**Objectif** : Vérifier que la protection anti-partage fonctionne toujours

**Étapes** :
1. Connectez-vous sur un appareil A avec un utilisateur
2. Connectez-vous sur un appareil B avec le même utilisateur
3. Observez ce qui se passe sur l'appareil A

**Résultat attendu** :
- ✅ L'appareil A devrait être déconnecté automatiquement
- ✅ Message : "Votre compte a été connecté depuis un autre appareil"

---

## 📊 Checklist de Tests

- [ ] **Test 2** : Connexion avec utilisateur existant
- [ ] **Test 3** : Créer un nouvel utilisateur via Dashboard
- [ ] **Test 4** : Connexion avec le nouvel utilisateur
- [ ] **Test 5** : Vérification de la licence
- [ ] **Test 6** : Anti-partage de compte

## 🎯 Tests Optionnels (Avancés)

### Test 7 : Créer un Utilisateur via Script SQL

**Étapes** :
1. Ouvrez le SQL Editor de Supabase
2. Copiez le script de [ALTERNATIVE_SANS_SERVICE_ROLE.md](ALTERNATIVE_SANS_SERVICE_ROLE.md)
3. Modifiez l'email et le mot de passe
4. Exécutez le script
5. Essayez de vous connecter avec ce nouvel utilisateur

**Résultat attendu** :
- ✅ L'utilisateur est créé
- ✅ La connexion fonctionne immédiatement

---

### Test 8 : Prolonger une Licence (Si vous avez configuré le code)

**Étapes** :
1. Ouvrez la console du navigateur (F12)
2. Tapez :
```javascript
import { extendUserLicense } from '@/lib/user-setup';

// Prolonger de 6 mois
const result = await extendUserLicense('user-id-here', 6);
console.log(result);
```

**Résultat attendu** :
- ✅ Message de succès
- ✅ La nouvelle date d'expiration est affichée

---

## 🆘 En Cas de Problème

### Problème : "Invalid login credentials"

**Causes possibles** :
1. Mot de passe incorrect
2. Email non confirmé
3. Utilisateur n'existe pas

**Solution** :
```sql
-- Vérifier l'utilisateur
SELECT 
  email,
  email_confirmed_at,
  encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'votre@email.com';
```

---

### Problème : "License expired"

**Cause** : La licence a expiré

**Solution** :
```sql
-- Prolonger la licence
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('license_expires_at', '2026-12-31T23:59:59Z')
WHERE email = 'votre@email.com';
```

---

### Problème : "User not found"

**Cause** : L'utilisateur n'existe pas dans `auth.users`

**Solution** :
1. Vérifiez que l'utilisateur existe :
```sql
SELECT email FROM auth.users WHERE email = 'votre@email.com';
```

2. Si non, créez-le via le Dashboard Supabase

---

## 📝 Rapport de Tests

Une fois les tests effectués, notez vos résultats :

```
Test 2 (Connexion existant) : ✅ / ❌
Test 3 (Créer nouveau) : ✅ / ❌
Test 4 (Connexion nouveau) : ✅ / ❌
Test 5 (Vérification licence) : ✅ / ❌
Test 6 (Anti-partage) : ✅ / ❌

Notes :
- ...
- ...
```

---

## 🎊 Conclusion

Si tous les tests passent :
- ✅ Votre système fonctionne parfaitement
- ✅ Plus besoin de requêtes SQL manuelles
- ✅ Tout est automatique

**Félicitations ! 🎉**

---

**Besoin d'aide ?** Consultez les autres guides :
- [REPONSE_SIMPLE.md](REPONSE_SIMPLE.md)
- [VERIFICATION_RAPIDE.md](VERIFICATION_RAPIDE.md)
- [GUIDE_SIMPLIFICATION_UTILISATEURS.md](GUIDE_SIMPLIFICATION_UTILISATEURS.md)
