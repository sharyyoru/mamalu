-- Create class_bookings table if it doesn't exist
-- Run this FIRST before the add_booking_payment_system.sql migration

-- First, disable RLS if table exists to allow modifications
ALTER TABLE IF EXISTS public.class_bookings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Staff can manage all bookings" ON public.class_bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.class_bookings;

CREATE TABLE IF NOT EXISTS public.class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  class_id TEXT NOT NULL,
  class_title TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  instructor_name TEXT,
  payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'per_session')),
  sessions_booked INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  dietary_notes TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON public.class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_user_id ON public.class_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_email ON public.class_bookings(attendee_email);
CREATE INDEX IF NOT EXISTS idx_class_bookings_status ON public.class_bookings(status);
CREATE INDEX IF NOT EXISTS idx_class_bookings_booking_number ON public.class_bookings(booking_number);

-- Enable RLS
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own bookings
CREATE POLICY "Users can view own bookings" ON public.class_bookings
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    attendee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Allow staff to manage all bookings
CREATE POLICY "Staff can manage all bookings" ON public.class_bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'instructor', 'super_admin')
    )
  );

-- Allow anyone to create bookings (for guest checkout)
CREATE POLICY "Anyone can create bookings" ON public.class_bookings
  FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_class_bookings_updated_at ON public.class_bookings;
CREATE TRIGGER update_class_bookings_updated_at
  BEFORE UPDATE ON public.class_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.class_bookings IS 'Class booking records';
