-- Campaign UTM Tracking and Revenue Attribution
-- This migration adds UTM tracking to campaigns and links bookings to campaigns

-- Add UTM fields to marketing_campaigns
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT 'email';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS utm_medium TEXT DEFAULT 'campaign';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

-- Create campaign_clicks table to track link clicks
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  session_id TEXT,
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2),
  booking_id UUID
);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id ON campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_session_id ON campaign_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_clicked_at ON campaign_clicks(clicked_at);

-- Add campaign attribution to class_bookings
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

CREATE INDEX IF NOT EXISTS idx_class_bookings_campaign_id ON class_bookings(campaign_id);

-- Add campaign attribution to payment_transactions if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
    ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create function to generate unique short codes for campaigns
CREATE OR REPLACE FUNCTION generate_campaign_short_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.short_code IS NULL THEN
    LOOP
      -- Generate a random 8-character code
      new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      -- Check if it exists
      SELECT EXISTS(SELECT 1 FROM marketing_campaigns WHERE short_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.short_code := new_code;
  END IF;
  
  -- Auto-set utm_campaign from name if not set
  IF NEW.utm_campaign IS NULL AND NEW.name IS NOT NULL THEN
    NEW.utm_campaign := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_campaign_code ON marketing_campaigns;
CREATE TRIGGER trigger_generate_campaign_code
BEFORE INSERT ON marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION generate_campaign_short_code();

-- Create view for campaign analytics
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
  mc.id,
  mc.name,
  mc.status,
  mc.total_sent,
  mc.total_opened,
  mc.total_clicked,
  mc.short_code,
  mc.created_at,
  COALESCE(clicks.click_count, 0) as tracked_clicks,
  COALESCE(bookings.booking_count, 0) as conversions,
  COALESCE(bookings.total_revenue, 0) as attributed_revenue,
  CASE 
    WHEN mc.total_sent > 0 THEN ROUND((COALESCE(bookings.booking_count, 0)::numeric / mc.total_sent) * 100, 2)
    ELSE 0 
  END as conversion_rate
FROM marketing_campaigns mc
LEFT JOIN (
  SELECT campaign_id, COUNT(*) as click_count
  FROM campaign_clicks
  GROUP BY campaign_id
) clicks ON clicks.campaign_id = mc.id
LEFT JOIN (
  SELECT campaign_id, COUNT(*) as booking_count, SUM(total_amount) as total_revenue
  FROM class_bookings
  WHERE campaign_id IS NOT NULL AND status IN ('confirmed', 'completed')
  GROUP BY campaign_id
) bookings ON bookings.campaign_id = mc.id;

-- RLS for campaign_clicks
ALTER TABLE campaign_clicks DISABLE ROW LEVEL SECURITY;
GRANT ALL ON campaign_clicks TO authenticated;
GRANT ALL ON campaign_clicks TO service_role;

-- Grant access to view
GRANT SELECT ON campaign_analytics TO authenticated;
GRANT SELECT ON campaign_analytics TO service_role;
