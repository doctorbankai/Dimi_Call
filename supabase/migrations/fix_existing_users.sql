-- Migration: Corriger tous les utilisateurs existants
-- Cette migration s'assure que tous les utilisateurs existants sont correctement configurés

-- 1. S'assurer que tous les utilisateurs ont aud = 'authenticated'
UPDATE auth.users
SET aud = 'authenticated'
WHERE aud IS NULL OR aud = '' OR aud != 'authenticated';

-- 2. S'assurer que tous les utilisateurs ont role = 'authenticated'
UPDATE auth.users
SET role = 'authenticated'
WHERE role IS NULL OR role = '' OR role != 'authenticated';

-- 3. Ajouter une licence par défaut (1 an) à tous les utilisateurs qui n'en ont pas
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('license_expires_at', (NOW() + INTERVAL '1 year')::timestamptz)
WHERE raw_app_meta_data IS NULL 
   OR NOT (raw_app_meta_data ? 'license_expires_at');

-- 4. Confirmer automatiquement les emails de tous les utilisateurs existants
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 5. Afficher un résumé des modifications
DO $$
DECLARE
  total_users INTEGER;
  users_with_license INTEGER;
  users_confirmed INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO users_with_license 
    FROM auth.users 
    WHERE raw_app_meta_data ? 'license_expires_at';
  SELECT COUNT(*) INTO users_confirmed 
    FROM auth.users 
    WHERE email_confirmed_at IS NOT NULL;
  
  RAISE NOTICE '✅ Migration terminée:';
  RAISE NOTICE '   - Total utilisateurs: %', total_users;
  RAISE NOTICE '   - Avec licence: %', users_with_license;
  RAISE NOTICE '   - Email confirmé: %', users_confirmed;
END $$;
