-- Add status change tracking columns to payment_links table
-- This allows tracking who marked a paid link as unpaid and why

ALTER TABLE public.payment_links
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

-- Create index for status change tracking
CREATE INDEX IF NOT EXISTS idx_payment_links_status_changed_by ON public.payment_links(status_changed_by);
CREATE INDEX IF NOT EXISTS idx_payment_links_status_changed_at ON public.payment_links(status_changed_at DESC);

-- Add comments
COMMENT ON COLUMN public.payment_links.status_changed_by IS 'User ID who changed the status from paid to unpaid';
COMMENT ON COLUMN public.payment_links.status_change_reason IS 'Reason provided for marking a paid link as unpaid';
COMMENT ON COLUMN public.payment_links.status_changed_at IS 'Timestamp when the status was changed from paid to unpaid';
