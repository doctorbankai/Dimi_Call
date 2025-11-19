BEGIN;

CREATE OR REPLACE FUNCTION public.dimicall_normalize_date(value text)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned text;
  matches text[];
  year_part int;
  month_part int;
  day_part int;
  serial numeric;
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := trim(value);
  IF cleaned = '' OR lower(cleaned) = 'null' THEN
    RETURN NULL;
  END IF;

  BEGIN
    RETURN cleaned::date;
  EXCEPTION WHEN others THEN
    -- ignore cast errors
  END;

  matches := regexp_match(cleaned, '^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$');
  IF matches IS NOT NULL THEN
    day_part := matches[1]::int;
    month_part := matches[2]::int;
    year_part := matches[3]::int;
    IF length(matches[3]) = 2 THEN
      year_part := CASE WHEN year_part >= 70 THEN 1900 + year_part ELSE 2000 + year_part END;
    END IF;
    IF day_part > 12 AND month_part <= 12 THEN
      RETURN make_date(year_part, month_part, day_part);
    ELSIF month_part > 12 AND day_part <= 12 THEN
      RETURN make_date(year_part, day_part, month_part);
    ELSE
      RETURN make_date(year_part, month_part, day_part);
    END IF;
  END IF;

  IF cleaned ~ '^\d+(\.\d+)?$' THEN
    serial := cleaned::numeric;
    IF serial > 0 AND serial < 100000 THEN
      RETURN date '1899-12-30' + floor(serial)::int;
    END IF;
  END IF;

  IF cleaned ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' THEN
    BEGIN
      RETURN to_timestamp(cleaned, 'YYYY-MM-DD HH24:MI:SS')::date;
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.dimicall_normalize_time(value text)
RETURNS time without time zone
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned text;
  numeric_val numeric;
  total_seconds integer;
  hours integer;
  minutes integer;
  seconds integer;
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := trim(value);
  IF cleaned = '' OR lower(cleaned) = 'null' THEN
    RETURN NULL;
  END IF;

  BEGIN
    RETURN cleaned::time;
  EXCEPTION WHEN others THEN
    -- continue with other parsing strategies
  END;

  IF cleaned ~ '^\d{1,2}h\d{2}$' THEN
    RETURN replace(cleaned, 'h', ':')::time;
  END IF;

  IF cleaned ~ '^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)$' THEN
    BEGIN
      IF cleaned ~ ':\d{2}:\d{2}\s*(AM|PM)$' THEN
        RETURN to_timestamp(cleaned, 'HH12:MI:SS AM')::time;
      ELSE
        RETURN to_timestamp(cleaned, 'HH12:MI AM')::time;
      END IF;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;

  IF cleaned ~ '^\d+(\.\d+)?$' THEN
    numeric_val := cleaned::numeric;
    IF numeric_val >= 0 AND numeric_val < 1 THEN
      total_seconds := round(numeric_val * 86400);
    ELSIF numeric_val >= 0 AND numeric_val < 24 THEN
      total_seconds := round(numeric_val * 3600);
    ELSE
      RETURN NULL;
    END IF;
    hours := (total_seconds / 3600)::int % 24;
    minutes := (total_seconds % 3600) / 60;
    seconds := total_seconds % 60;
    RETURN make_time(hours, minutes, seconds);
  END IF;

  RETURN NULL;
END;
$$;

ALTER TABLE call_data_events
  ADD COLUMN date_rappel_tmp date,
  ADD COLUMN date_rdv_tmp date,
  ADD COLUMN date_appel_tmp date,
  ADD COLUMN date_contact_tmp date,
  ADD COLUMN heure_rappel_tmp time without time zone,
  ADD COLUMN heure_rdv_tmp time without time zone,
  ADD COLUMN heure_appel_tmp time without time zone;

UPDATE call_data_events
SET
  date_rappel_tmp = public.dimicall_normalize_date(date_rappel),
  date_rdv_tmp = public.dimicall_normalize_date(date_rdv),
  date_appel_tmp = public.dimicall_normalize_date(date_appel),
  date_contact_tmp = public.dimicall_normalize_date(date_contact),
  heure_rappel_tmp = public.dimicall_normalize_time(heure_rappel),
  heure_rdv_tmp = public.dimicall_normalize_time(heure_rdv),
  heure_appel_tmp = public.dimicall_normalize_time(heure_appel);

ALTER TABLE call_data_events
  DROP COLUMN date_rappel,
  DROP COLUMN date_rdv,
  DROP COLUMN date_appel,
  DROP COLUMN date_contact,
  DROP COLUMN heure_rappel,
  DROP COLUMN heure_rdv,
  DROP COLUMN heure_appel;

ALTER TABLE call_data_events RENAME COLUMN date_rappel_tmp TO date_rappel;
ALTER TABLE call_data_events RENAME COLUMN date_rdv_tmp TO date_rdv;
ALTER TABLE call_data_events RENAME COLUMN date_appel_tmp TO date_appel;
ALTER TABLE call_data_events RENAME COLUMN date_contact_tmp TO date_contact;
ALTER TABLE call_data_events RENAME COLUMN heure_rappel_tmp TO heure_rappel;
ALTER TABLE call_data_events RENAME COLUMN heure_rdv_tmp TO heure_rdv;
ALTER TABLE call_data_events RENAME COLUMN heure_appel_tmp TO heure_appel;

UPDATE call_data_events
SET duree_appel =
  lpad(((split_part(duree_appel, ':', 1)::int) * 60 + split_part(duree_appel, ':', 2)::int)::text, 2, '0')
  || ':' ||
  lpad((split_part(duree_appel, ':', 3)::int)::text, 2, '0')
WHERE duree_appel IS NOT NULL
  AND duree_appel ~ '^\d{1,2}:\d{2}:\d{2}$';

UPDATE call_data_events
SET duree_appel = lpad(split_part(duree_appel, ':', 1), 2, '0') || ':' || lpad(split_part(duree_appel, ':', 2), 2, '0')
WHERE duree_appel IS NOT NULL
  AND duree_appel ~ '^\d{1,3}:\d{1,2}$';

UPDATE call_data_events
SET duree_appel = NULL
WHERE duree_appel IS NOT NULL
  AND btrim(duree_appel) = '';

ALTER TABLE call_data_events
  ADD CONSTRAINT call_data_events_duree_format_chk
    CHECK (duree_appel IS NULL OR duree_appel ~ '^\d{2,}:\d{2}$');

ALTER TABLE call_data_events
  ADD COLUMN applied_at timestamptz;

UPDATE call_data_events
SET applied_at = COALESCE(
  CASE
    WHEN metadata ->> 'applied_at' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$'
      THEN (metadata ->> 'applied_at')::timestamptz
    WHEN metadata ->> 'applied_at' ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$'
      THEN (replace(metadata ->> 'applied_at', ' ', 'T') || 'Z')::timestamptz
    ELSE NULL
  END,
  synced_at
);

ALTER TABLE call_data_events
  ALTER COLUMN applied_at SET DEFAULT timezone('utc'::text, now());

ALTER TABLE call_data_events
  ALTER COLUMN synced_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN synced_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE call_data_events
  ALTER COLUMN contact_id SET NOT NULL,
  ALTER COLUMN telephone SET NOT NULL,
  ALTER COLUMN normalized_phone SET NOT NULL,
  ALTER COLUMN user_uid SET NOT NULL,
  ALTER COLUMN user_email SET NOT NULL;

ALTER TABLE call_data_events
  ADD CONSTRAINT call_data_events_phone_e164_chk
    CHECK (normalized_phone ~ '^\+[0-9]{8,15}$');

ALTER TABLE call_data_events
  ADD CONSTRAINT call_data_events_user_uid_fkey
    FOREIGN KEY (user_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE call_data_events
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS call_data_events_select ON call_data_events;
DROP POLICY IF EXISTS call_data_events_insert ON call_data_events;
DROP POLICY IF EXISTS call_data_events_update ON call_data_events;

CREATE POLICY call_data_events_select ON call_data_events
  FOR SELECT
  USING (auth.role() = 'service_role' OR auth.uid() = user_uid);

CREATE POLICY call_data_events_insert ON call_data_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_uid);

CREATE POLICY call_data_events_update ON call_data_events
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() = user_uid)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_uid);

COMMIT;

