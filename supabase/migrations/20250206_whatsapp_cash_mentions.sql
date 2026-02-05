-- Create table for storing WhatsApp cash keyword mentions
CREATE TABLE IF NOT EXISTS whatsapp_cash_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT,
  contact_name TEXT,
  message_text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  chat_id TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  matched_keywords TEXT[] DEFAULT '{}',
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'false_positive', 'dismissed')),
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cash_mentions_timestamp ON whatsapp_cash_mentions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cash_mentions_status ON whatsapp_cash_mentions(review_status);
CREATE INDEX IF NOT EXISTS idx_cash_mentions_from ON whatsapp_cash_mentions(from_number);

-- Enable RLS
ALTER TABLE whatsapp_cash_mentions ENABLE ROW LEVEL SECURITY;

-- Policy for super admins to manage cash mentions
CREATE POLICY "Super admins can manage cash mentions"
  ON whatsapp_cash_mentions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Grant permissions
GRANT ALL ON whatsapp_cash_mentions TO authenticated;
