CREATE TABLE IF NOT EXISTS public.summer_camp_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_unit TEXT NOT NULL DEFAULT 'per guest',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT summer_camp_items_price_nonnegative CHECK (price >= 0)
);

DROP TRIGGER IF EXISTS update_summer_camp_items_updated_at ON public.summer_camp_items;
CREATE TRIGGER update_summer_camp_items_updated_at
  BEFORE UPDATE ON public.summer_camp_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.summer_camp_items (
  id,
  name,
  description,
  price,
  price_unit,
  image_url,
  is_active,
  sort_order
)
VALUES
  (
    'summer-camp-per-day',
    'Per Day',
    'Summer camp class by day',
    250,
    'per guest per day',
    '/images/summer camp .png',
    TRUE,
    10
  ),
  (
    'summer-camp-per-week',
    'Per Week',
    'Summer camp class by week',
    1000,
    'per guest per week',
    '/images/week 1 summer camp.png',
    TRUE,
    20
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_unit = EXCLUDED.price_unit,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

GRANT ALL ON public.summer_camp_items TO service_role;
GRANT SELECT ON public.summer_camp_items TO anon;
GRANT SELECT ON public.summer_camp_items TO authenticated;
