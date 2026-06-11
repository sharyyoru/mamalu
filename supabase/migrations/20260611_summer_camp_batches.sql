CREATE TABLE IF NOT EXISTS public.summer_camp_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  camp_dates DATE[] NOT NULL DEFAULT ARRAY[]::DATE[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT summer_camp_batches_five_dates CHECK (array_length(camp_dates, 1) = 5)
);

DROP TRIGGER IF EXISTS update_summer_camp_batches_updated_at ON public.summer_camp_batches;
CREATE TRIGGER update_summer_camp_batches_updated_at
  BEFORE UPDATE ON public.summer_camp_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_summer_camp_batches_sort_order
  ON public.summer_camp_batches(sort_order, created_at);

GRANT ALL ON public.summer_camp_batches TO service_role;
GRANT SELECT ON public.summer_camp_batches TO anon;
GRANT SELECT ON public.summer_camp_batches TO authenticated;
