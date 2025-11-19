BEGIN;

-- Nettoyage des données invalides avant contraintes
DELETE FROM shared_phone_numbers
WHERE normalized_phone IS NULL OR normalized_phone !~ '^\+[0-9]{8,15}$';

DELETE FROM shared_blacklist_numbers
WHERE normalized_phone IS NULL OR normalized_phone !~ '^\+[0-9]{8,15}$';

-- Contraintes de format E.164
ALTER TABLE shared_phone_numbers
  ADD CONSTRAINT shared_phone_numbers_normalized_chk
    CHECK (normalized_phone ~ '^\+[0-9]{8,15}$');

ALTER TABLE shared_blacklist_numbers
  ADD CONSTRAINT shared_blacklist_numbers_normalized_chk
    CHECK (normalized_phone ~ '^\+[0-9]{8,15}$');

-- Nettoyage d'index dupliqués
DROP INDEX IF EXISTS shared_phone_numbers_normalized_phone_idx;
DROP INDEX IF EXISTS shared_blacklist_numbers_normalized_phone_idx;

-- Activer RLS
ALTER TABLE shared_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_blacklist_numbers ENABLE ROW LEVEL SECURITY;

-- Politiques sécurisées
DROP POLICY IF EXISTS shared_phone_numbers_select ON shared_phone_numbers;
DROP POLICY IF EXISTS shared_phone_numbers_insert ON shared_phone_numbers;
DROP POLICY IF EXISTS shared_phone_numbers_update ON shared_phone_numbers;
DROP POLICY IF EXISTS shared_phone_numbers_delete ON shared_phone_numbers;

DROP POLICY IF EXISTS shared_blacklist_numbers_select ON shared_blacklist_numbers;
DROP POLICY IF EXISTS shared_blacklist_numbers_insert ON shared_blacklist_numbers;
DROP POLICY IF EXISTS shared_blacklist_numbers_update ON shared_blacklist_numbers;
DROP POLICY IF EXISTS shared_blacklist_numbers_delete ON shared_blacklist_numbers;

CREATE POLICY shared_phone_numbers_select_auth ON shared_phone_numbers
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY shared_phone_numbers_insert_auth ON shared_phone_numbers
  FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY shared_phone_numbers_update_auth ON shared_phone_numbers
  FOR UPDATE
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY shared_blacklist_numbers_select_auth ON shared_blacklist_numbers
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY shared_blacklist_numbers_insert_auth ON shared_blacklist_numbers
  FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY shared_blacklist_numbers_update_auth ON shared_blacklist_numbers
  FOR UPDATE
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

COMMIT;

