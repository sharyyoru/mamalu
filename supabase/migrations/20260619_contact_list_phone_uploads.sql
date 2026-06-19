-- Allow imported list members to be identified by email or phone.
ALTER TABLE contact_list_members
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE contact_list_members
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE contact_list_members
  ADD COLUMN IF NOT EXISTS contact_key TEXT GENERATED ALWAYS AS (
    COALESCE(NULLIF(lower(trim(email)), ''), NULLIF(trim(phone), ''))
  ) STORED;

ALTER TABLE contact_list_members
  DROP CONSTRAINT IF EXISTS contact_list_members_list_id_email_key;

ALTER TABLE contact_list_members
  ADD CONSTRAINT contact_list_members_has_email_or_phone
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS contact_list_members_list_id_contact_key_key
  ON contact_list_members(list_id, contact_key);

CREATE INDEX IF NOT EXISTS idx_contact_list_members_phone ON contact_list_members(phone);
