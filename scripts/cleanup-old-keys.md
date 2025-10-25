# 🧹 Nettoyage des Anciennes Clés API

## ⚠️ ATTENTION: Clés Compromises Détectées

Les fichiers suivants contiennent des clés API hardcodées qui doivent être supprimées:

### Fichiers à Nettoyer:
1. ✅ `src/lib/supabase.ts` - **DÉJÀ NETTOYÉ**
2. ✅ `src/services/supabaseService.ts` - **DÉJÀ NETTOYÉ**
3. ⚠️ `backup/src-original/services/supabaseService.ts` - **À NETTOYER**
4. ⚠️ `services/supabaseService.ts` - **À NETTOYER**

### Clé Compromise:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbmFnd29xbGhxdG5oZmlha29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTY5MzAsImV4cCI6MjA2NDk5MjkzMH0.8IjJYZRT9B8PRsP40S7-wvY2achfwoZ6NEaZSFNHRgY
```

**Cette clé DOIT être régénérée immédiatement!**

## 🔧 Actions à Effectuer

### 1. Régénérer la Clé API
```bash
# Étapes:
1. Allez sur https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom/settings/api
2. Section "Project API keys"
3. Trouvez "anon public"
4. Cliquez sur l'icône de régénération (🔄)
5. Confirmez la régénération
6. Copiez la NOUVELLE clé
```

### 2. Mettre à Jour .env.local
```bash
# Créez ou modifiez .env.local à la racine du projet
VITE_SUPABASE_URL=https://oqnagwoqlhqtnhfiakom.supabase.co
VITE_SUPABASE_ANON_KEY=votre_nouvelle_cle_ici
```

### 3. Nettoyer les Fichiers de Backup (Optionnel)
```bash
# Si vous n'utilisez plus ces fichiers, supprimez-les:
rm backup/src-original/services/supabaseService.ts
rm services/supabaseService.ts

# Ou remplacez les clés par des placeholders:
# Remplacez la clé par: 'YOUR_SUPABASE_ANON_KEY_HERE'
```

### 4. Vérifier le .gitignore
```bash
# Assurez-vous que .env.local est bien ignoré
cat .gitignore | grep ".env.local"

# Devrait afficher:
# .env.local
# *.env.local
```

### 5. Supprimer l'Historique Git (Si Nécessaire)
```bash
# ⚠️ ATTENTION: Ceci réécrit l'historique Git
# À faire UNIQUEMENT si la clé a été commitée

# Option 1: Utiliser git-filter-repo (recommandé)
pip install git-filter-repo
git filter-repo --invert-paths --path src/lib/supabase.ts

# Option 2: Utiliser BFG Repo-Cleaner
# Téléchargez BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# Option 3: Si le repo est privé et petit, créez un nouveau repo
# 1. Créez un nouveau repo vide
# 2. Copiez les fichiers (sans .git)
# 3. Initialisez un nouveau git
# 4. Commitez avec les nouvelles clés
```

## 🔍 Vérification

### Vérifier qu'aucune clé n'est hardcodée:
```bash
# Rechercher les clés hardcodées
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir=node_modules --exclude-dir=.git

# Devrait retourner: (aucun résultat)
# Si des fichiers sont trouvés, nettoyez-les
```

### Vérifier que .env.local existe:
```bash
# Vérifier l'existence
ls -la .env.local

# Vérifier le contenu (sans afficher la clé)
cat .env.local | grep "VITE_SUPABASE_URL"
cat .env.local | grep "VITE_SUPABASE_ANON_KEY" | wc -c
# Devrait afficher un nombre > 50 (longueur de la clé)
```

### Vérifier que l'app fonctionne:
```bash
# Démarrer en mode dev
npm run dev

# Ouvrir la console navigateur (F12)
# Vous devriez voir:
# 🔧 [DEBUG] Supabase configuré: { url: "https://...", hasKey: true }

# Vous NE devriez PAS voir:
# ❌ Configuration Supabase manquante!
```

## 📋 Checklist de Sécurité

- [ ] Nouvelle clé API générée dans Supabase Dashboard
- [ ] Fichier .env.local créé avec la nouvelle clé
- [ ] Fichier .env.local dans .gitignore
- [ ] Anciennes clés supprimées de src/lib/supabase.ts
- [ ] Anciennes clés supprimées de src/services/supabaseService.ts
- [ ] Fichiers de backup nettoyés ou supprimés
- [ ] Aucune clé trouvée avec grep
- [ ] Application démarre sans erreur
- [ ] Connexion Supabase fonctionne
- [ ] (Optionnel) Historique Git nettoyé

## 🎯 Résultat Final

Une fois toutes les étapes complétées:
- ✅ Aucune clé API dans le code source
- ✅ Clés stockées uniquement dans .env.local (non versionné)
- ✅ Ancienne clé compromise révoquée
- ✅ Nouvelle clé sécurisée active
- ✅ Impossible d'exposer accidentellement les clés

**Votre configuration est maintenant sécurisée!** 🔒
