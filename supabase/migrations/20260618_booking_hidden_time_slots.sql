CREATE TABLE IF NOT EXISTS public.booking_hidden_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hidden_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_hidden_time_slots_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_booking_hidden_time_slots_date
  ON public.booking_hidden_time_slots(hidden_date);

DROP TRIGGER IF EXISTS update_booking_hidden_time_slots_updated_at ON public.booking_hidden_time_slots;
CREATE TRIGGER update_booking_hidden_time_slots_updated_at
  BEFORE UPDATE ON public.booking_hidden_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON public.booking_hidden_time_slots TO service_role;
GRANT SELECT ON public.booking_hidden_time_slots TO anon;
GRANT SELECT ON public.booking_hidden_time_slots TO authenticated;
