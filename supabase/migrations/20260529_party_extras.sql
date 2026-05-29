ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.menu_items
ALTER COLUMN categories SET DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'menu_items'
      AND column_name = 'category'
  ) THEN
    EXECUTE 'UPDATE public.menu_items SET categories = ARRAY[category] WHERE (categories IS NULL OR cardinality(categories) = 0) AND category IS NOT NULL';
    EXECUTE 'ALTER TABLE public.menu_items ALTER COLUMN category DROP NOT NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_menu_items_categories ON public.menu_items USING GIN (categories);

INSERT INTO public.menu_items (categories, name, description, price, price_unit, image_url, emoji, is_active, sort_order, metadata)
VALUES
  (ARRAY['party_extras'], 'Customized Apron', 'Personalized Mamalu apron with name', 80, 'per item', '/personalized-items/apron.jpg', NULL, TRUE, 10, '{"extra_category":"custom","icon":"gift"}'::jsonb),
  (ARRAY['party_extras'], 'Customized Spatula', 'Personalized cooking spatula', 50, 'per item', '/personalized-items/spatula.jpg', NULL, TRUE, 20, '{"extra_category":"custom","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Customized Chef Hat', 'Personalized chef hat', 60, 'per item', '/personalized-items/chef-hat.jpg', NULL, TRUE, 30, '{"extra_category":"custom","icon":"gift"}'::jsonb),
  (ARRAY['party_extras'], 'Customized Mugs', 'Personalized mug with any design', 45, 'per item', '/personalized-items/mugs.jpg', NULL, TRUE, 40, '{"extra_category":"custom","icon":"gift"}'::jsonb),
  (ARRAY['party_extras'], 'Customized Cakes (10 persons)', 'Custom designed birthday cake', 575, 'per item', NULL, NULL, TRUE, 50, '{"extra_category":"cake","icon":"cake"}'::jsonb),
  (ARRAY['party_extras'], 'Customized Cakes (20 persons)', 'Custom designed birthday cake', 700, 'per item', NULL, NULL, TRUE, 60, '{"extra_category":"cake","icon":"cake"}'::jsonb),
  (ARRAY['party_extras'], 'Customized Cakes (30 persons)', 'Custom designed birthday cake', 900, 'per item', NULL, NULL, TRUE, 70, '{"extra_category":"cake","icon":"cake"}'::jsonb),
  (ARRAY['party_extras'], 'Table Set Up (10 persons)', 'Plates, cups, spoons, forks, knives, napkins, tablecloth', 300, 'per item', NULL, NULL, TRUE, 80, '{"extra_category":"decor","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Table Set Up (20 persons)', 'Plates, cups, spoons, forks, knives, napkins, tablecloth', 400, 'per item', NULL, NULL, TRUE, 90, '{"extra_category":"decor","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Table Set Up (30 persons)', 'Plates, cups, spoons, forks, knives, napkins, tablecloth', 500, 'per item', NULL, NULL, TRUE, 100, '{"extra_category":"decor","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Balloons (14 pcs balloons)', '2 bunches of 7 balloons (any color)', 260, 'per item', NULL, NULL, TRUE, 110, '{"extra_category":"decor","icon":"party"}'::jsonb),
  (ARRAY['party_extras'], 'Mini Pizzas (12pcs)', '12 pieces of delicious mini pizzas', 50, 'per item', '/snacks-and-drinks/SMILEY PIZZA.jpeg', NULL, TRUE, 120, '{"extra_category":"snacks","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Chicken Tenders (12pcs)', '12 pieces of crispy chicken tenders', 60, 'per item', '/snacks-and-drinks/CHICKEN TENDERS.jpeg', NULL, TRUE, 130, '{"extra_category":"snacks","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Mini Burgers (6pcs)', '6 pieces of mini burgers', 70, 'per item', '/snacks-and-drinks/mini burgers.jpeg', NULL, TRUE, 140, '{"extra_category":"snacks","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Musakhan Rolls', 'Delicious musakhan rolls', 50, 'per item', '/snacks-and-drinks/MUSAKHAN ROLLS.jpeg', NULL, TRUE, 150, '{"extra_category":"snacks","icon":"utensils"}'::jsonb),
  (ARRAY['party_extras'], 'Juices (per pc)', 'Fresh juice per piece', 8, 'per item', NULL, NULL, TRUE, 160, '{"extra_category":"drinks","icon":"drinks"}'::jsonb),
  (ARRAY['party_extras'], 'Soft Drinks (per pc)', 'Soft drink per piece', 15, 'per item', NULL, NULL, TRUE, 170, '{"extra_category":"drinks","icon":"drinks"}'::jsonb)
ON CONFLICT DO NOTHING;
