-- Add waiver/terms acceptance fields to class_bookings
-- This allows tracking of digital waiver signatures for liability protection

-- Add waiver columns to class_bookings table
ALTER TABLE public.class_bookings 
ADD COLUMN IF NOT EXISTS waiver_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waiver_signature TEXT,
ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waiver_ip_address TEXT,
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- Create index for waiver tracking
CREATE INDEX IF NOT EXISTS idx_class_bookings_waiver ON public.class_bookings(waiver_accepted);

-- Comments for documentation
COMMENT ON COLUMN public.class_bookings.waiver_accepted IS 'Whether the client accepted the waiver and terms';
COMMENT ON COLUMN public.class_bookings.waiver_signature IS 'Digital signature (typed full name)';
COMMENT ON COLUMN public.class_bookings.waiver_signed_at IS 'Timestamp when waiver was signed';
COMMENT ON COLUMN public.class_bookings.waiver_ip_address IS 'Client IP address for legal record';
COMMENT ON COLUMN public.class_bookings.terms_version IS 'Version of terms accepted for audit trail';
