-- Script de vérification de la sécurité Supabase
-- À exécuter dans l'éditeur SQL de Supabase Dashboard

-- ============================================
-- 1. VÉRIFICATION DU TRIGGER
-- ============================================
SELECT 
  '✅ TRIGGER' as check_type,
  tgname as name,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as status
FROM pg_trigger 
WHERE tgname = 'enforce_single_session'

UNION ALL

-- ============================================
-- 2. VÉRIFICATION DE LA FONCTION
-- ============================================
SELECT 
  '✅ FONCTION' as check_type,
  proname as name,
  '✅ Existe' as status
FROM pg_proc 
WHERE proname = 'limit_user_sessions'

UNION ALL

-- ============================================
-- 3. VÉRIFICATION DE LA TABLE
-- ============================================
SELECT 
  '✅ TABLE' as check_type,
  tablename as name,
  '✅ Existe' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'active_sessions'

UNION ALL

-- ============================================
-- 4. VÉRIFICATION RLS
-- ============================================
SELECT 
  '✅ RLS' as check_type,
  tablename as name,
  CASE 
    WHEN rowsecurity THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'active_sessions';

-- ============================================
-- 5. STATISTIQUES DES SESSIONS
-- ============================================
SELECT 
  '📊 STATS' as info_type,
  'Sessions actives' as metric,
  COUNT(*)::text as value
FROM public.active_sessions

UNION ALL

SELECT 
  '📊 STATS' as info_type,
  'Utilisateurs connectés' as metric,
  COUNT(DISTINCT user_id)::text as value
FROM public.active_sessions

UNION ALL

SELECT 
  '📊 STATS' as info_type,
  'Sessions multiples' as metric,
  COUNT(*)::text as value
FROM (
  SELECT user_id
  FROM public.active_sessions
  GROUP BY user_id
  HAVING COUNT(*) > 1
) as multi_sessions;

-- ============================================
-- 6. DÉTAIL DES SESSIONS ACTIVES
-- ============================================
SELECT 
  '📋 SESSIONS' as info_type,
  u.email as user_email,
  s.device_info,
  s.created_at::text as created,
  s.last_activity::text as last_activity
FROM public.active_sessions s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC
LIMIT 10;

-- ============================================
-- 7. VÉRIFICATION DES POLITIQUES RLS
-- ============================================
SELECT 
  '🔒 POLICIES' as check_type,
  policyname as name,
  cmd as command,
  '✅ Existe' as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'active_sessions'
ORDER BY policyname;

-- ============================================
-- RÉSUMÉ
-- ============================================
-- Si vous voyez:
-- ✅ TRIGGER: enforce_single_session (Activé)
-- ✅ FONCTION: limit_user_sessions (Existe)
-- ✅ TABLE: active_sessions (Existe)
-- ✅ RLS: active_sessions (Activé)
-- 📊 STATS: Sessions multiples = 0
-- 🔒 POLICIES: 3 politiques (SELECT, INSERT, DELETE)
--
-- Alors votre système est 100% sécurisé! 🎉
