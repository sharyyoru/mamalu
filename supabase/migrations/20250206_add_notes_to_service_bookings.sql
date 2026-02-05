-- Add notes column to service_bookings table
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment
COMMENT ON COLUMN service_bookings.notes IS 'General notes for the booking';
