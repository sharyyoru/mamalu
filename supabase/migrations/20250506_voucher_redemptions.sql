-- Voucher Redemptions table to track voucher usage and bookings
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  voucher_code TEXT NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  menu_item_name TEXT NOT NULL,
  menu_item_price NUMERIC(10,2) NOT NULL,
  
  -- Customer details
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Booking details
  event_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  number_of_guests INTEGER DEFAULT 1,
  special_requests TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_status ON voucher_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_redeemed_at ON voucher_redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_event_date ON voucher_redemptions(event_date);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_customer_email ON voucher_redemptions(customer_email);

-- RLS policies
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on voucher_redemptions" ON voucher_redemptions
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON voucher_redemptions TO authenticated;
GRANT ALL ON voucher_redemptions TO service_role;

-- Add uses_count column to vouchers if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vouchers' AND column_name = 'uses_count') 
  THEN
    ALTER TABLE vouchers ADD COLUMN uses_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add max_uses column to vouchers if it doesn't exist (default 1 for single-use vouchers)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vouchers' AND column_name = 'max_uses') 
  THEN
    ALTER TABLE vouchers ADD COLUMN max_uses INTEGER DEFAULT 1;
  END IF;
END $$;
