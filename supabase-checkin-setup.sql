-- =====================================================
-- BOOKING CHECK-IN SYSTEM - DATABASE SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add check-in fields to class_bookings table
ALTER TABLE class_bookings 
ADD COLUMN IF NOT EXISTS qr_code_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guests_checked_in INT DEFAULT 0;

-- 2. Create index for fast QR code lookups
CREATE INDEX IF NOT EXISTS idx_class_bookings_qr_token ON class_bookings(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_class_bookings_checked_in ON class_bookings(checked_in_at);

-- 3. Create booking_guests table for individual guest QR codes
CREATE TABLE IF NOT EXISTS booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES class_bookings(id) ON DELETE CASCADE,
  guest_number INT NOT NULL,
  guest_name VARCHAR(255),
  qr_code_token UUID UNIQUE DEFAULT gen_random_uuid(),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, guest_number)
);

-- 4. Create indexes for booking_guests
CREATE INDEX IF NOT EXISTS idx_booking_guests_booking ON booking_guests(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_guests_qr_token ON booking_guests(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_booking_guests_checked_in ON booking_guests(checked_in_at);

-- 5. Enable RLS on booking_guests
ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for booking_guests
CREATE POLICY "Staff can view all guests" ON booking_guests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can manage guests" ON booking_guests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- 7. Create check-in logs table for audit trail
CREATE TABLE IF NOT EXISTS booking_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES class_bookings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES booking_guests(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id),
  check_in_method VARCHAR(20) DEFAULT 'qr_scan' CHECK (check_in_method IN ('qr_scan', 'manual', 'auto')),
  device_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for check-in logs
CREATE INDEX IF NOT EXISTS idx_booking_checkins_booking ON booking_checkins(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_checkins_date ON booking_checkins(checked_in_at DESC);

-- 5. Enable RLS on booking_checkins
ALTER TABLE booking_checkins ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for booking_checkins
-- Staff/Admin can view all check-ins
CREATE POLICY "Staff can view all check-ins" ON booking_checkins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- Staff/Admin can insert check-ins
CREATE POLICY "Staff can create check-ins" ON booking_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
    )
  );

-- 7. Function to check in a booking by QR token
CREATE OR REPLACE FUNCTION check_in_booking(
  p_qr_token UUID,
  p_staff_id UUID DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_result JSON;
BEGIN
  -- Find booking by QR token
  SELECT * INTO v_booking
  FROM class_bookings
  WHERE qr_code_token = p_qr_token
  AND status = 'confirmed';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or unpaid booking'
    );
  END IF;
  
  -- Check if already checked in
  IF v_booking.checked_in_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Already checked in',
      'checked_in_at', v_booking.checked_in_at,
      'booking', row_to_json(v_booking)
    );
  END IF;
  
  -- Update booking as checked in
  UPDATE class_bookings
  SET 
    checked_in_at = NOW(),
    checked_in_by = p_staff_id
  WHERE id = v_booking.id;
  
  -- Log the check-in
  INSERT INTO booking_checkins (
    booking_id, 
    checked_in_by, 
    check_in_method,
    device_info
  ) VALUES (
    v_booking.id,
    p_staff_id,
    'qr_scan',
    p_device_info
  );
  
  -- Return success with booking details
  SELECT json_build_object(
    'success', true,
    'message', 'Check-in successful',
    'booking', row_to_json(b)
  ) INTO v_result
  FROM class_bookings b
  WHERE b.id = v_booking.id;
  
  RETURN v_result;
END;
$$;

-- 8. Function to get event attendance stats
CREATE OR REPLACE FUNCTION get_class_attendance_stats(p_class_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_bookings', COUNT(*),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'checked_in', COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_stats
  FROM class_bookings
  WHERE class_id = p_class_id;
  
  RETURN v_stats;
END;
$$;

-- 9. Function to increment guests_checked_in counter
CREATE OR REPLACE FUNCTION increment_guests_checked_in(booking_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE class_bookings
  SET guests_checked_in = COALESCE(guests_checked_in, 0) + 1
  WHERE id = booking_id;
END;
$$;

-- 10. Grant execute permissions
GRANT EXECUTE ON FUNCTION check_in_booking TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_attendance_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_guests_checked_in TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check if columns were added:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'class_bookings';

-- Check if table was created:
-- SELECT * FROM booking_checkins LIMIT 1;
