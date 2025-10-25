-- Migration pour limiter les sessions à 1 par utilisateur (plan gratuit)
-- Cette solution fonctionne sur le plan gratuit de Supabase

-- 1. Créer une fonction pour limiter les sessions
CREATE OR REPLACE FUNCTION limit_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer toutes les anciennes sessions de cet utilisateur
  -- sauf la nouvelle qui vient d'être créée
  DELETE FROM auth.sessions
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND created_at < NEW.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger sur la table sessions
DROP TRIGGER IF EXISTS enforce_single_session ON auth.sessions;
CREATE TRIGGER enforce_single_session
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION limit_user_sessions();

-- 3. Créer une table pour tracker les sessions actives (backup)
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- 4. Index pour performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON public.active_sessions(last_activity);

-- 5. RLS pour sécuriser la table
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir uniquement leurs propres sessions
CREATE POLICY "Users can view own sessions"
  ON public.active_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres sessions
CREATE POLICY "Users can insert own sessions"
  ON public.active_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres sessions
CREATE POLICY "Users can delete own sessions"
  ON public.active_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Fonction pour nettoyer les sessions inactives (> 24h)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_sessions
  WHERE last_activity < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Commentaires pour documentation
COMMENT ON FUNCTION limit_user_sessions() IS 'Limite automatiquement à 1 session active par utilisateur';
COMMENT ON TABLE public.active_sessions IS 'Tracking des sessions actives pour détection de partage de compte';
