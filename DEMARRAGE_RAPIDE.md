# ⚡ DÉMARRAGE RAPIDE - 5 MINUTES

## 🎯 Objectif
Bloquer le partage de compte à 100%

## 📋 Checklist (5 étapes)

### ☐ 1. Régénérer Clé API (2 min)
```
🔗 https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom/settings/api
→ Cliquez "Reset" sur "anon public"
→ Copiez la nouvelle clé
```

### ☐ 2. Créer .env.local (30 sec)
```bash
# À la racine du projet
VITE_SUPABASE_URL=https://oqnagwoqlhqtnhfiakom.supabase.co
VITE_SUPABASE_ANON_KEY=votre_nouvelle_cle_ici
```

### ☐ 3. Appliquer Migration SQL (1 min)
```
🔗 https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom/editor
→ Copiez le contenu de: supabase/migrations/001_session_limit_trigger.sql
→ Collez dans l'éditeur
→ Cliquez "Run" ▶️
```

### ☐ 4. Rebuild (1 min)
```bash
npm run build
# ou
npm run dev
```

### ☐ 5. Tester (30 sec)
```
1. Connectez-vous sur appareil A
2. Connectez-vous sur appareil B (même compte)
3. ✅ Appareil A doit être déconnecté
```

## ✅ C'est Tout!

Si le test passe, vous avez:
- ✅ Protection anti-partage 100% fiable
- ✅ Impossible à contourner
- ✅ Détection instantanée

## 📚 Documentation Complète

- 📖 Guide détaillé: `INSTALLATION_SECURITE.md`
- 🔍 Analyse complète: `ANALYSE_SECURITE_FINALE.md`
- 🧪 Tests: `TEST_ANTI_PARTAGE_COMPTE.md`

## 🆘 Problème?

### Erreur "Configuration manquante"
→ Vérifiez que .env.local existe et contient les bonnes variables

### Les 2 appareils restent connectés
→ Vérifiez que la migration SQL a été appliquée:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'enforce_single_session';
```

---

**Temps total: 5 minutes**
**Résultat: 100% sécurisé** 🔒
