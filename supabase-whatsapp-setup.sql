-- =====================================================
-- WHATSAPP MONITORING SYSTEM - SUPABASE SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This creates all tables, RLS policies, and storage buckets

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- WhatsApp Accounts (linked to super admins)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  business_account_id VARCHAR(255) NOT NULL,
  whatsapp_business_account_id VARCHAR(255),
  access_token TEXT,
  webhook_verify_token VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  display_name VARCHAR(255),
  profile_picture_url TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number),
  UNIQUE(business_account_id)
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  message_id VARCHAR(255) NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  message_text TEXT,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker')),
  media_url TEXT,
  media_mime_type VARCHAR(100),
  direction VARCHAR(10) DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  timestamp TIMESTAMPTZ NOT NULL,
  context_message_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, account_id)
);

-- Flagged Messages (AI-detected cash mentions)
CREATE TABLE IF NOT EXISTS flagged_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) DEFAULT 'cash_mention' CHECK (flag_type IN ('cash_mention', 'payment_request', 'suspicious_activity', 'custom')),
  confidence_score DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  matched_keywords TEXT[],
  context_snippet TEXT,
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'false_positive', 'dismissed')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Reports (aggregated data for super admins)
CREATE TABLE IF NOT EXISTS whatsapp_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  report_type VARCHAR(50) DEFAULT 'daily' CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  report_date DATE NOT NULL,
  total_messages INT DEFAULT 0,
  flagged_messages INT DEFAULT 0,
  confirmed_violations INT DEFAULT 0,
  false_positives INT DEFAULT 0,
  top_keywords JSONB DEFAULT '[]',
  summary TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, report_type, report_date)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_super_admin ON whatsapp_accounts(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_account ON whatsapp_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_text_search ON whatsapp_messages USING gin(to_tsvector('english', message_text));

CREATE INDEX IF NOT EXISTS idx_flagged_messages_account ON flagged_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_flagged_messages_status ON flagged_messages(review_status);
CREATE INDEX IF NOT EXISTS idx_flagged_messages_flagged_at ON flagged_messages(flagged_at DESC);
CREATE INDEX IF NOT EXISTS idx_flagged_messages_message ON flagged_messages(message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reports_account ON whatsapp_reports(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reports_date ON whatsapp_reports(report_date DESC);

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to whatsapp_accounts
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- WHATSAPP_ACCOUNTS POLICIES
-- =====================================================

-- Super admins can view their own accounts
CREATE POLICY "Super admins can view their own WhatsApp accounts"
  ON whatsapp_accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND profiles.id = whatsapp_accounts.super_admin_id
    )
  );

-- Super admins can insert their own accounts
CREATE POLICY "Super admins can create their own WhatsApp accounts"
  ON whatsapp_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND profiles.id = whatsapp_accounts.super_admin_id
    )
  );

-- Super admins can update their own accounts
CREATE POLICY "Super admins can update their own WhatsApp accounts"
  ON whatsapp_accounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND profiles.id = whatsapp_accounts.super_admin_id
    )
  );

-- Super admins can delete their own accounts
CREATE POLICY "Super admins can delete their own WhatsApp accounts"
  ON whatsapp_accounts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND profiles.id = whatsapp_accounts.super_admin_id
    )
  );

-- =====================================================
-- WHATSAPP_MESSAGES POLICIES
-- =====================================================

-- Super admins can view messages from their accounts
CREATE POLICY "Super admins can view messages from their WhatsApp accounts"
  ON whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_accounts
      JOIN profiles ON profiles.id = whatsapp_accounts.super_admin_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND whatsapp_accounts.id = whatsapp_messages.account_id
    )
  );

-- Service role can insert messages (for webhook)
CREATE POLICY "Service role can insert messages"
  ON whatsapp_messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Super admins can update messages from their accounts
CREATE POLICY "Super admins can update messages from their WhatsApp accounts"
  ON whatsapp_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_accounts
      JOIN profiles ON profiles.id = whatsapp_accounts.super_admin_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND whatsapp_accounts.id = whatsapp_messages.account_id
    )
  );

-- =====================================================
-- FLAGGED_MESSAGES POLICIES
-- =====================================================

-- Super admins can view flagged messages from their accounts
CREATE POLICY "Super admins can view flagged messages from their accounts"
  ON flagged_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_accounts
      JOIN profiles ON profiles.id = whatsapp_accounts.super_admin_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND whatsapp_accounts.id = flagged_messages.account_id
    )
  );

-- Service role can insert flagged messages (for AI system)
CREATE POLICY "Service role can insert flagged messages"
  ON flagged_messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Super admins can update flagged messages (for review)
CREATE POLICY "Super admins can update flagged messages from their accounts"
  ON flagged_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_accounts
      JOIN profiles ON profiles.id = whatsapp_accounts.super_admin_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND whatsapp_accounts.id = flagged_messages.account_id
    )
  );

-- =====================================================
-- WHATSAPP_REPORTS POLICIES
-- =====================================================

-- Super admins can view reports from their accounts
CREATE POLICY "Super admins can view reports from their accounts"
  ON whatsapp_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_accounts
      JOIN profiles ON profiles.id = whatsapp_accounts.super_admin_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND whatsapp_accounts.id = whatsapp_reports.account_id
    )
  );

-- Service role can insert reports (for automated generation)
CREATE POLICY "Service role can insert reports"
  ON whatsapp_reports
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- 5. CREATE STORAGE BUCKET FOR WHATSAPP MEDIA
-- =====================================================

-- Create storage bucket for WhatsApp media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-media', 'whatsapp-media', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Super admins can view media from their accounts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'whatsapp-media'
    AND EXISTS (
      SELECT 1 FROM whatsapp_accounts
      JOIN profiles ON profiles.id = whatsapp_accounts.super_admin_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND (storage.objects.name LIKE whatsapp_accounts.id::text || '/%')
    )
  );

CREATE POLICY "Service role can upload media"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'whatsapp-media');

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get flagged message statistics
CREATE OR REPLACE FUNCTION get_flagged_message_stats(account_uuid UUID, days_back INT DEFAULT 7)
RETURNS TABLE (
  total_flagged BIGINT,
  pending_review BIGINT,
  confirmed BIGINT,
  false_positives BIGINT,
  avg_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_flagged,
    COUNT(*) FILTER (WHERE review_status = 'pending')::BIGINT as pending_review,
    COUNT(*) FILTER (WHERE review_status = 'confirmed')::BIGINT as confirmed,
    COUNT(*) FILTER (WHERE review_status = 'false_positive')::BIGINT as false_positives,
    ROUND(AVG(confidence_score), 2) as avg_confidence
  FROM flagged_messages
  WHERE account_id = account_uuid
  AND flagged_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily report
CREATE OR REPLACE FUNCTION generate_daily_whatsapp_report(account_uuid UUID, report_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  msg_count INT;
  flag_count INT;
  confirmed_count INT;
  false_pos_count INT;
  keywords JSONB;
BEGIN
  -- Get message counts
  SELECT COUNT(*) INTO msg_count
  FROM whatsapp_messages
  WHERE account_id = account_uuid
  AND DATE(timestamp) = report_date;

  -- Get flagged message counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE review_status = 'confirmed'),
    COUNT(*) FILTER (WHERE review_status = 'false_positive')
  INTO flag_count, confirmed_count, false_pos_count
  FROM flagged_messages
  WHERE account_id = account_uuid
  AND DATE(flagged_at) = report_date;

  -- Get top keywords
  SELECT jsonb_agg(keyword_data)
  INTO keywords
  FROM (
    SELECT jsonb_build_object('keyword', keyword, 'count', count) as keyword_data
    FROM (
      SELECT unnest(matched_keywords) as keyword, COUNT(*) as count
      FROM flagged_messages
      WHERE account_id = account_uuid
      AND DATE(flagged_at) = report_date
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 10
    ) top_kw
  ) kw_agg;

  -- Insert or update report
  INSERT INTO whatsapp_reports (
    account_id,
    report_type,
    report_date,
    total_messages,
    flagged_messages,
    confirmed_violations,
    false_positives,
    top_keywords,
    summary
  ) VALUES (
    account_uuid,
    'daily',
    report_date,
    msg_count,
    flag_count,
    confirmed_count,
    false_pos_count,
    COALESCE(keywords, '[]'::jsonb),
    format('Daily report: %s messages, %s flagged (%s confirmed)', msg_count, flag_count, confirmed_count)
  )
  ON CONFLICT (account_id, report_type, report_date)
  DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    flagged_messages = EXCLUDED.flagged_messages,
    confirmed_violations = EXCLUDED.confirmed_violations,
    false_positives = EXCLUDED.false_positives,
    top_keywords = EXCLUDED.top_keywords,
    summary = EXCLUDED.summary,
    generated_at = NOW()
  RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on tables to authenticated users
GRANT SELECT, INSERT, UPDATE ON whatsapp_accounts TO authenticated;
GRANT SELECT, UPDATE ON whatsapp_messages TO authenticated;
GRANT SELECT, UPDATE ON flagged_messages TO authenticated;
GRANT SELECT ON whatsapp_reports TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON whatsapp_accounts TO service_role;
GRANT ALL ON whatsapp_messages TO service_role;
GRANT ALL ON flagged_messages TO service_role;
GRANT ALL ON whatsapp_reports TO service_role;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables are created in Table Editor
-- 3. Check storage bucket 'whatsapp-media' is created
-- 4. Test RLS policies with super_admin user
-- 5. Set up WhatsApp Business API webhook
-- =====================================================
