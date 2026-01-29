-- Add extras support to payment_links table
-- This allows tracking additional items like table setup, aprons, mugs, etc.

ALTER TABLE public.payment_links
ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]';

-- Add extras_total for quick reference
ALTER TABLE public.payment_links
ADD COLUMN IF NOT EXISTS extras_total DECIMAL(10,2) DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_links_extras ON public.payment_links USING gin(extras);

-- Add comments
COMMENT ON COLUMN public.payment_links.extras IS 'Array of extra items with name, price, and quantity (e.g., table setup, aprons, mugs)';
COMMENT ON COLUMN public.payment_links.extras_total IS 'Total price of all extras combined';
