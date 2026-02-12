-- Booking System Updates (from Booking System Notes)

-- 1. Add walk_in to lead_source enum
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'walk_in';

-- 2. Add age_range and waiver_accepted to service_bookings
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS waiver_accepted BOOLEAN DEFAULT FALSE;
