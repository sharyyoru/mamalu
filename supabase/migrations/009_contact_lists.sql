-- Contact Lists for Marketing
-- Allows creating custom lists of contacts for targeted campaigns

-- Contact lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- List members junction table
CREATE TABLE IF NOT EXISTS contact_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  contact_id UUID, -- Optional reference to newsletter_leads or profiles
  contact_source TEXT, -- 'newsletter_leads' or 'profiles'
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_list_members_list_id ON contact_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_members_email ON contact_list_members(email);

-- Function to update contact count
CREATE OR REPLACE FUNCTION update_list_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contact_lists SET contact_count = contact_count + 1, updated_at = NOW() WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contact_lists SET contact_count = contact_count - 1, updated_at = NOW() WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating count
DROP TRIGGER IF EXISTS trigger_update_list_count ON contact_list_members;
CREATE TRIGGER trigger_update_list_count
AFTER INSERT OR DELETE ON contact_list_members
FOR EACH ROW EXECUTE FUNCTION update_list_contact_count();

-- RLS Policies - Disable RLS for these admin tables since we use service role
ALTER TABLE contact_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and service roles
GRANT ALL ON contact_lists TO authenticated;
GRANT ALL ON contact_list_members TO authenticated;
GRANT ALL ON contact_lists TO service_role;
GRANT ALL ON contact_list_members TO service_role;
