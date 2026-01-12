-- =====================================================
-- PAYMENT LINKS - MULTI-GUEST SUPPORT UPDATE
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to payment_links table
ALTER TABLE payment_links 
ADD COLUMN IF NOT EXISTS price_per_person DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS number_of_people INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_code_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guests_checked_in INT DEFAULT 0;

-- 2. Create index for QR code lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_qr_token ON payment_links(qr_code_token);

-- 3. Create payment_link_guests table for individual guest QR codes
CREATE TABLE IF NOT EXISTS payment_link_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  guest_number INT NOT NULL,
  guest_name VARCHAR(255),
  qr_code_token UUID UNIQUE DEFAULT gen_random_uuid(),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_link_id, guest_number)
);

-- 4. Create indexes for payment_link_guests
CREATE INDEX IF NOT EXISTS idx_payment_link_guests_link ON payment_link_guests(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_link_guests_qr_token ON payment_link_guests(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_payment_link_guests_checked_in ON payment_link_guests(checked_in_at);

-- 5. Enable RLS on payment_link_guests
ALTER TABLE payment_link_guests ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for payment_link_guests
CREATE POLICY "Staff can view all payment link guests" ON payment_link_guests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can manage payment link guests" ON payment_link_guests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- 7. Function to increment guests_checked_in for payment links
CREATE OR REPLACE FUNCTION increment_payment_link_guests_checked_in(link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE payment_links
  SET guests_checked_in = COALESCE(guests_checked_in, 0) + 1
  WHERE id = link_id;
END;
$$;

-- 8. Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_payment_link_guests_checked_in TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if columns were added:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_links';

-- Check if table was created:
-- SELECT * FROM payment_link_guests LIMIT 1;
