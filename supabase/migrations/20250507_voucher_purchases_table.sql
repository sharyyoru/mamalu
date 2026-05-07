-- Create voucher_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS voucher_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  voucher_code TEXT,
  paid_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_stripe_session 
ON voucher_purchases(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_voucher_purchases_customer_email 
ON voucher_purchases(customer_email);

CREATE INDEX IF NOT EXISTS idx_voucher_purchases_status 
ON voucher_purchases(status);

CREATE INDEX IF NOT EXISTS idx_voucher_purchases_voucher_id 
ON voucher_purchases(voucher_id);

-- RLS policies
ALTER TABLE voucher_purchases ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on voucher_purchases" 
ON voucher_purchases
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON voucher_purchases TO authenticated;
GRANT ALL ON voucher_purchases TO service_role;

-- Add email_sent_at column if table already exists but column doesn't
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'voucher_purchases') 
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'voucher_purchases' AND column_name = 'email_sent_at') 
  THEN
    ALTER TABLE voucher_purchases ADD COLUMN email_sent_at TIMESTAMPTZ;
  END IF;
END $$;
