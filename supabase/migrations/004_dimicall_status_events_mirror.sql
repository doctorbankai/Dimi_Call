BEGIN;

-- Mirror of the local SQLite `status_events` table used by DimiCall charts.
-- Goal: enable server-side dashboards to reproduce EXACTLY the same chart inputs.
--
-- Notes:
-- - `local_event_id` is the original SQLite `status_events.id`.
-- - `raw_event` can store the full original row payload (optional but recommended).
-- - RLS restricts rows to the owning `user_uid` (or service_role).

CREATE TABLE IF NOT EXISTS public.dimicall_status_events (
  id bigserial PRIMARY KEY,

  -- Ownership (multi-tenant)
  user_uid uuid NOT NULL,
  user_email text NOT NULL,

  -- Identity of the local event (SQLite `status_events.id`)
  local_event_id bigint NOT NULL,

  -- Core fields used by chart computations
  contact_id text NOT NULL,
  old_status text,
  new_status text,
  applied_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Optional mirrored fields (best-effort typing)
  prenom text,
  nom text,
  telephone text,
  email text,
  commentaire text,
  date_rappel date,
  heure_rappel time without time zone,
  date_rdv date,
  heure_rdv time without time zone,
  date_appel date,
  heure_appel time without time zone,
  duree_appel text,
  date_entree date,
  heure_entree time without time zone,
  numero_ligne integer,
  source text,
  statut text,
  lien text,
  sexe text,
  don text,
  qualite text,
  type_contact text,
  date_contact date,
  uid text,
  uid_supabase text,
  utilisateur text,
  actions text,
  statut_appel text,
  statut_rdv text,
  commentaire_rdv text,

  -- Full raw row payload for exact fidelity (optional)
  raw_event jsonb,

  -- Audit
  synced_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.dimicall_status_events
  ADD CONSTRAINT dimicall_status_events_user_uid_fkey
    FOREIGN KEY (user_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS dimicall_status_events_user_local_event_uidx
  ON public.dimicall_status_events (user_uid, local_event_id);

CREATE INDEX IF NOT EXISTS dimicall_status_events_user_applied_at_idx
  ON public.dimicall_status_events (user_uid, applied_at DESC);

CREATE INDEX IF NOT EXISTS dimicall_status_events_user_contact_applied_idx
  ON public.dimicall_status_events (user_uid, contact_id, applied_at DESC);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.dimicall_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dimicall_status_events_set_updated_at ON public.dimicall_status_events;
CREATE TRIGGER dimicall_status_events_set_updated_at
BEFORE UPDATE ON public.dimicall_status_events
FOR EACH ROW
EXECUTE FUNCTION public.dimicall_set_updated_at();

ALTER TABLE public.dimicall_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dimicall_status_events_select ON public.dimicall_status_events;
DROP POLICY IF EXISTS dimicall_status_events_insert ON public.dimicall_status_events;
DROP POLICY IF EXISTS dimicall_status_events_update ON public.dimicall_status_events;
DROP POLICY IF EXISTS dimicall_status_events_delete ON public.dimicall_status_events;

CREATE POLICY dimicall_status_events_select ON public.dimicall_status_events
  FOR SELECT
  USING (auth.role() = 'service_role' OR auth.uid() = user_uid);

CREATE POLICY dimicall_status_events_insert ON public.dimicall_status_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_uid);

CREATE POLICY dimicall_status_events_update ON public.dimicall_status_events
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() = user_uid)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_uid);

CREATE POLICY dimicall_status_events_delete ON public.dimicall_status_events
  FOR DELETE
  USING (auth.role() = 'service_role' OR auth.uid() = user_uid);

COMMIT;

