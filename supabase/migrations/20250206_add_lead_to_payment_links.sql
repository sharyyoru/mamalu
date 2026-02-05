-- Add lead_id to payment_links table for direct lead association
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);

-- Create index for faster lead lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_lead ON payment_links(lead_id);

-- Add comment
COMMENT ON COLUMN payment_links.lead_id IS 'Direct link to the lead this payment link belongs to';
