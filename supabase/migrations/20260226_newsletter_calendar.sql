-- Newsletter Leads table for CRM
CREATE TABLE IF NOT EXISTS newsletter_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_leads_email ON newsletter_leads(email);

-- Calendar Items table for monthly schedules
CREATE TABLE IF NOT EXISTS calendar_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  image_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Create index on month/year for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_items_month_year ON calendar_items(month, year);

-- Enable RLS
ALTER TABLE newsletter_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_items ENABLE ROW LEVEL SECURITY;

-- Policies for newsletter_leads (service role can do everything)
CREATE POLICY "Service role can manage newsletter_leads" ON newsletter_leads
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for calendar_items (service role can do everything)
CREATE POLICY "Service role can manage calendar_items" ON calendar_items
  FOR ALL USING (true) WITH CHECK (true);

-- Public can read calendar_items
CREATE POLICY "Public can read calendar_items" ON calendar_items
  FOR SELECT USING (true);
