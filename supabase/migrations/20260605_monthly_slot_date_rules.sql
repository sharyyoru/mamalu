CREATE TABLE IF NOT EXISTS public.booking_slot_date_rules (
  category_id TEXT PRIMARY KEY,
  available_dates DATE[] NOT NULL DEFAULT ARRAY[]::DATE[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_slot_date_rules_monthly_only CHECK (category_id IN ('monthly_mini', 'monthly_big'))
);

DROP TRIGGER IF EXISTS update_booking_slot_date_rules_updated_at ON public.booking_slot_date_rules;
CREATE TRIGGER update_booking_slot_date_rules_updated_at
  BEFORE UPDATE ON public.booking_slot_date_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.booking_slot_date_rules (category_id, available_dates)
VALUES
  ('monthly_mini', ARRAY[]::DATE[]),
  ('monthly_big', ARRAY[]::DATE[])
ON CONFLICT (category_id) DO NOTHING;

GRANT ALL ON public.booking_slot_date_rules TO service_role;
GRANT SELECT ON public.booking_slot_date_rules TO anon;
GRANT SELECT ON public.booking_slot_date_rules TO authenticated;
