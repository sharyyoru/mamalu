-- Extend newsletter_leads table with additional contact fields
ALTER TABLE newsletter_leads 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'cleaned', 'nonsubscribed')),
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS original_source TEXT,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_leads_status ON newsletter_leads(status);

-- Create index on phone for lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_leads_phone ON newsletter_leads(phone);
