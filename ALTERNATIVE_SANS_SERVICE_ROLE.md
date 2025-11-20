# 🔐 Alternative : Gestion des Utilisateurs SANS Clé Service Role

## 🎯 Objectif

Créer et gérer des utilisateurs **sans exposer la clé service_role** côté client.

## ⚠️ Pourquoi Éviter la Clé Service Role Côté Client ?

La clé `service_role` donne un accès **complet** à votre base de données :
- ❌ Contourne toutes les politiques RLS
- ❌ Peut supprimer/modifier n'importe quelle donnée
- ❌ Ne devrait JAMAIS être dans le code frontend

## ✅ Solution 1 : Utiliser le Dashboard Supabase (Simplifié)

### Étape 1 : Créer l'Utilisateur

1. Allez sur https://supabase.com/dashboard
2. Naviguez vers **Authentication** → **Users**
3. Cliquez sur **"Add user"** → **"Create new user"**
4. Remplissez :
   - Email : `utilisateur@exemple.com`
   - Password : `motdepasse123`
   - ✅ Cochez **"Auto Confirm User"**
5. Cliquez sur **"Create user"**

### Étape 2 : Ajouter la Licence (Automatique !)

**Bonne nouvelle** : Grâce à la migration SQL que nous avons appliquée, tous les nouveaux utilisateurs reçoivent automatiquement une licence de 1 an !

Vérifiez :
```sql
SELECT 
  email,
  raw_app_meta_data->>'license_expires_at' as license
FROM auth.users
WHERE email = 'utilisateur@exemple.com';
```

Si la licence n'est pas présente (cas rare), ajoutez-la manuellement :

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('license_expires_at', '2026-12-31T23:59:59Z')
WHERE email = 'utilisateur@exemple.com';
```

### Étape 3 : Tester

L'utilisateur peut maintenant se connecter immédiatement !

## ✅ Solution 2 : Script SQL Simplifié

Créez un script SQL que vous pouvez exécuter dans le **SQL Editor** de Supabase :

```sql
-- Script : Créer un utilisateur complet
-- Remplacez les valeurs ci-dessous

DO $$
DECLARE
  new_email TEXT := 'utilisateur@exemple.com';
  new_password TEXT := 'motdepasse123';
  license_months INTEGER := 12;
  new_user_id UUID;
BEGIN
  -- Note : Cette méthode nécessite l'extension pgcrypto
  -- Elle est déjà installée par défaut dans Supabase
  
  -- Créer l'utilisateur
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    new_email,
    crypt(new_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'license_expires_at', (NOW() + (license_months || ' months')::INTERVAL)::timestamptz
    ),
    '{}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  -- Créer l'identité
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', new_email
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Utilisateur créé avec succès: %', new_email;
  RAISE NOTICE '   ID: %', new_user_id;
  RAISE NOTICE '   Licence valide jusqu''au: %', (NOW() + (license_months || ' months')::INTERVAL)::date;
END $$;
```

### Utilisation

1. Ouvrez le **SQL Editor** dans Supabase
2. Copiez le script ci-dessus
3. Modifiez les valeurs :
   - `new_email` : l'email de l'utilisateur
   - `new_password` : le mot de passe
   - `license_months` : durée de la licence en mois
4. Exécutez le script
5. ✅ L'utilisateur est créé et prêt !

## ✅ Solution 3 : Edge Function (Production)

Pour une solution automatisée et sécurisée en production, créez une Edge Function.

### Étape 1 : Créer la Fonction

```bash
# Dans votre terminal
supabase functions new create-user
```

### Étape 2 : Code de la Fonction

```typescript
// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer un client admin avec la clé service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Vérifier que l'appelant est authentifié et autorisé
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = user.app_metadata?.role === 'admin';
    if (!isAdmin) {
      throw new Error('Accès refusé : rôle admin requis');
    }

    // Récupérer les paramètres
    const { email, password, licenseMonths = 12 } = await req.json();

    if (!email || !password) {
      throw new Error('Email et mot de passe requis');
    }

    // Créer l'utilisateur
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        license_expires_at: new Date(
          Date.now() + licenseMonths * 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      }
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Utilisateur ${email} créé avec succès`,
        userId: data.user?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
```

### Étape 3 : Déployer

```bash
supabase functions deploy create-user
```

### Étape 4 : Utiliser dans l'Application

```typescript
// src/lib/user-setup-edge.ts
import { supabase } from './supabase';

export async function createUserViaEdgeFunction(
  email: string,
  password: string,
  licenseMonths: number = 12
) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, licenseMonths })
    }
  );

  return await response.json();
}
```

## 📊 Comparaison des Solutions

| Solution | Sécurité | Facilité | Automatisation | Production |
|----------|----------|----------|----------------|------------|
| Dashboard Supabase | ✅ Excellente | ✅ Très facile | ❌ Manuelle | ❌ Non |
| Script SQL | ✅ Excellente | ⚠️ Moyenne | ⚠️ Semi-auto | ⚠️ Possible |
| Edge Function | ✅ Excellente | ⚠️ Complexe | ✅ Complète | ✅ Oui |

## 🎯 Recommandations

### Pour le Développement
Utilisez le **Dashboard Supabase** :
- Simple et rapide
- Pas de code nécessaire
- Parfait pour tester

### Pour la Production
Utilisez une **Edge Function** :
- Sécurisé (clé service_role côté serveur)
- Automatisé
- Contrôle d'accès intégré

### Pour l'Administration Ponctuelle
Utilisez le **Script SQL** :
- Rapide pour créer plusieurs utilisateurs
- Pas besoin de déployer du code
- Exécutable directement dans Supabase

## ✅ Résumé

Vous avez maintenant **3 méthodes sécurisées** pour créer des utilisateurs sans exposer la clé service_role :

1. **Dashboard** - Pour les tests et l'administration manuelle
2. **Script SQL** - Pour les créations en batch
3. **Edge Function** - Pour l'automatisation en production

**Tous les utilisateurs créés sont automatiquement configurés et prêts à se connecter !**

---

**Note** : La migration SQL que nous avons appliquée garantit que tous les utilisateurs (nouveaux et existants) ont automatiquement une licence valide. Vous n'avez plus besoin de requêtes SQL manuelles !
