ALTER TABLE public.summer_camp_items
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_start_date DATE,
  ADD COLUMN IF NOT EXISTS discount_end_date DATE;

ALTER TABLE public.summer_camp_items
  DROP CONSTRAINT IF EXISTS summer_camp_items_discount_percentage_range,
  ADD CONSTRAINT summer_camp_items_discount_percentage_range
    CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE public.summer_camp_items
  DROP CONSTRAINT IF EXISTS summer_camp_items_discount_date_order,
  ADD CONSTRAINT summer_camp_items_discount_date_order
    CHECK (
      discount_start_date IS NULL
      OR discount_end_date IS NULL
      OR discount_start_date <= discount_end_date
    );
