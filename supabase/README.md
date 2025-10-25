# 🗄️ Migrations Supabase

## 📁 Contenu

### 001_session_limit_trigger.sql
**Protection anti-partage de compte**

Cette migration crée:
- ✅ Trigger SQL pour limiter à 1 session par utilisateur
- ✅ Table `active_sessions` pour le tracking
- ✅ Politiques RLS pour la sécurité
- ✅ Fonction de nettoyage automatique

## 🚀 Application

### Via Supabase Dashboard (Recommandé)
```
1. Ouvrez: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Copiez le contenu de: migrations/001_session_limit_trigger.sql
3. Collez dans l'éditeur SQL
4. Cliquez sur "Run" (▶️)
```

### Via Supabase CLI
```bash
# Si vous avez installé Supabase CLI
supabase db push
```

## ✅ Vérification

Après application, vérifiez que tout est créé:

```sql
-- Vérifier le trigger
SELECT * FROM pg_trigger WHERE tgname = 'enforce_single_session';

-- Vérifier la fonction
SELECT * FROM pg_proc WHERE proname = 'limit_user_sessions';

-- Vérifier la table
SELECT * FROM pg_tables WHERE tablename = 'active_sessions';

-- Vérifier RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'active_sessions';
```

## 🔍 Fonctionnement

### Trigger SQL
```sql
-- Déclenché à chaque nouvelle connexion
-- Supprime automatiquement les anciennes sessions
-- Garantit max 1 session par utilisateur
```

### Table active_sessions
```sql
-- Stocke les sessions actives
-- Permet la détection de sessions concurrentes
-- Nettoyage automatique après 24h
```

### Politiques RLS
```sql
-- Les utilisateurs voient uniquement leurs sessions
-- Protection contre les accès non autorisés
-- Sécurité renforcée
```

## 📊 Monitoring

### Voir les sessions actives
```sql
SELECT 
  u.email,
  s.device_info,
  s.created_at,
  s.last_activity
FROM public.active_sessions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC;
```

### Statistiques
```sql
-- Nombre de sessions par utilisateur
SELECT 
  user_id,
  COUNT(*) as session_count
FROM public.active_sessions
GROUP BY user_id;

-- Devrait toujours montrer max 1 session par user_id
```

## 🧹 Maintenance

### Nettoyage Manuel
```sql
-- Supprimer les sessions inactives >24h
SELECT cleanup_inactive_sessions();
```

### Nettoyage Automatique (Optionnel)
```sql
-- Nécessite l'extension pg_cron
SELECT cron.schedule(
  'cleanup-sessions',
  '0 * * * *', -- Toutes les heures
  'SELECT cleanup_inactive_sessions();'
);
```

## 🆘 Dépannage

### Erreur: "relation active_sessions does not exist"
→ La migration n'a pas été appliquée correctement
→ Réappliquez la migration complète

### Erreur: "permission denied for table active_sessions"
→ Les politiques RLS ne sont pas correctes
→ Vérifiez que RLS est activé et que les 3 politiques existent

### Les sessions ne sont pas limitées
→ Vérifiez que le trigger existe et est activé
→ Exécutez: `SELECT * FROM pg_trigger WHERE tgname = 'enforce_single_session';`

## 📚 Documentation

Pour plus d'informations, consultez:
- [INSTALLATION_SECURITE.md](../INSTALLATION_SECURITE.md)
- [SUPABASE_SECURITY_IMPLEMENTATION.md](../SUPABASE_SECURITY_IMPLEMENTATION.md)
- [TEST_ANTI_PARTAGE_COMPTE.md](../TEST_ANTI_PARTAGE_COMPTE.md)

---

**Cette migration est CRITIQUE pour la sécurité de votre application!**
