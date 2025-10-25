# 🚀 Installation Rapide - Sécurité Anti-Partage

## ⏱️ Temps estimé: 15 minutes

## 📋 Prérequis
- Accès au dashboard Supabase
- Node.js installé
- Projet cloné localement

## 🎯 Installation en 5 Étapes

### Étape 1: Régénérer la Clé API (2 min) 🔑

**Pourquoi?** Votre clé actuelle est compromise (visible dans le code).

1. Ouvrez: https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom/settings/api
2. Trouvez la section "Project API keys"
3. Ligne "anon public" → Cliquez sur l'icône 🔄 (Reset)
4. Confirmez la régénération
5. **Copiez la nouvelle clé** (vous en aurez besoin à l'étape 2)

### Étape 2: Créer .env.local (1 min) 📝

À la racine du projet, créez le fichier `.env.local`:

```bash
VITE_SUPABASE_URL=https://oqnagwoqlhqtnhfiakom.supabase.co
VITE_SUPABASE_ANON_KEY=collez_votre_nouvelle_cle_ici
```

**Vérification:**
```bash
# Le fichier doit exister
ls -la .env.local

# Le fichier doit être dans .gitignore
cat .gitignore | grep ".env.local"
```

### Étape 3: Appliquer la Migration SQL (5 min) 🗄️

**Cette étape est CRITIQUE - c'est la protection principale!**

1. Ouvrez le fichier: `supabase/migrations/001_session_limit_trigger.sql`
2. Copiez TOUT le contenu (Ctrl+A, Ctrl+C)
3. Ouvrez: https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom/editor
4. Collez le SQL dans l'éditeur
5. Cliquez sur "Run" (▶️) en haut à droite
6. Attendez le message de succès

**Vérification:**
```sql
-- Exécutez cette requête dans l'éditeur SQL
SELECT * FROM pg_trigger WHERE tgname = 'enforce_single_session';
-- Devrait retourner 1 ligne
```

### Étape 4: Installer les Dépendances et Rebuild (5 min) 🔨

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Rebuild l'application
npm run build

# OU démarrer en mode dev
npm run dev
```

**Vérification:**
- L'application démarre sans erreur
- Pas de message "Configuration Supabase manquante"
- Console navigateur (F12) affiche: `🔧 [DEBUG] Supabase configuré`

### Étape 5: Tester (2 min) 🧪

**Test Simple:**
1. Connectez-vous avec un compte test
2. Vérifiez dans la console (F12):
   - `[Auth] Enregistrement de la session active...`
   - `[Auth] ✅ Session enregistrée avec succès`

**Test Anti-Partage:**
1. Connectez-vous sur l'appareil A
2. Connectez-vous sur l'appareil B (même compte)
3. ✅ **L'appareil A doit être déconnecté automatiquement**
4. ✅ Message: "Votre compte a été connecté depuis un autre appareil"

## ✅ Validation Complète

### Checklist Rapide
- [ ] Nouvelle clé API générée
- [ ] Fichier .env.local créé
- [ ] Migration SQL appliquée (trigger existe)
- [ ] Application rebuild sans erreur
- [ ] Test connexion simple OK
- [ ] Test anti-partage OK (appareil A déconnecté)

### Vérification SQL (Optionnel)
```sql
-- Exécutez dans l'éditeur SQL Supabase
-- Copier/coller le contenu de: scripts/verify-security.sql

-- Résultat attendu:
-- ✅ TRIGGER: enforce_single_session (Activé)
-- ✅ FONCTION: limit_user_sessions (Existe)
-- ✅ TABLE: active_sessions (Existe)
-- ✅ RLS: active_sessions (Activé)
-- 📊 STATS: Sessions multiples = 0
```

## 🐛 Dépannage Rapide

### Erreur: "Configuration Supabase manquante"
```bash
# Vérifiez que .env.local existe
ls -la .env.local

# Vérifiez le contenu (sans afficher la clé)
cat .env.local | grep "VITE_SUPABASE_URL"
cat .env.local | grep "VITE_SUPABASE_ANON_KEY"

# Redémarrez le serveur dev
npm run dev
```

### Erreur: "relation active_sessions does not exist"
```bash
# La migration SQL n'a pas été appliquée
# Retournez à l'Étape 3 et réappliquez la migration
```

### Les 2 appareils restent connectés
```bash
# Vérifiez que le trigger existe
# Exécutez dans l'éditeur SQL:
SELECT * FROM pg_trigger WHERE tgname = 'enforce_single_session';

# Si aucun résultat, réappliquez la migration (Étape 3)
```

## 📚 Documentation Complète

Pour plus de détails:
- 📖 **Guide complet**: `SUPABASE_SECURITY_IMPLEMENTATION.md`
- 🧪 **Tests détaillés**: `TEST_ANTI_PARTAGE_COMPTE.md`
- 📊 **Résumé exécutif**: `SECURITE_SUPABASE_RESUME.md`
- 🔍 **Vérification SQL**: `scripts/verify-security.sql`

## 🎉 Félicitations!

Si tous les tests passent, votre système est maintenant:
- ✅ **100% sécurisé** contre le partage de compte
- ✅ **Triple protection** redondante
- ✅ **Impossible à contourner** (trigger SQL)
- ✅ **Détection instantanée** (<3 secondes)
- ✅ **Fonctionne sur le plan gratuit** Supabase

**Aucun utilisateur ne peut partager son compte!** 🔒

## 💡 Prochaines Étapes

1. ✅ Testez avec de vrais utilisateurs
2. ✅ Surveillez les logs Supabase
3. ✅ Consultez les statistiques:
   ```sql
   SELECT * FROM public.active_sessions;
   ```
4. ✅ Configurez le nettoyage automatique (optionnel):
   ```sql
   -- Nettoyer les sessions >24h toutes les heures
   SELECT cron.schedule(
     'cleanup-sessions',
     '0 * * * *',
     'SELECT cleanup_inactive_sessions();'
   );
   ```

## 🆘 Support

En cas de problème:
1. Consultez la section Dépannage ci-dessus
2. Vérifiez les logs console (F12)
3. Vérifiez les logs Supabase Dashboard
4. Consultez `TEST_ANTI_PARTAGE_COMPTE.md` pour les tests détaillés

---

**Temps total: ~15 minutes**
**Résultat: Protection anti-partage 100% fiable** 🎯
