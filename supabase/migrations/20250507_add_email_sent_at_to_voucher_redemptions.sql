-- Add email_sent_at column to voucher_redemptions table to track confirmation emails
ALTER TABLE voucher_redemptions 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Add index for email tracking
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_email_sent_at 
ON voucher_redemptions(email_sent_at);
