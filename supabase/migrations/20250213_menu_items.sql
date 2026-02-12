-- Menu Items table for admin-editable menus
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('birthday', 'corporate', 'nanny', 'walkin', 'extras_food', 'extras_merch')),
  name TEXT NOT NULL,
  description TEXT,
  dishes TEXT[] DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_unit TEXT DEFAULT 'per person',
  image_url TEXT,
  emoji TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  min_guests INTEGER,
  max_guests INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);

-- RLS policies
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active menu items (public frontend)
CREATE POLICY "Anyone can read active menu items" ON menu_items
  FOR SELECT USING (is_active = true);

-- Service role can do everything
CREATE POLICY "Service role full access on menu_items" ON menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON menu_items TO authenticated;
GRANT SELECT ON menu_items TO anon;

-- Storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-images bucket
CREATE POLICY "Anyone can view menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can update menu images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can delete menu images" ON storage.objects
  FOR DELETE USING (bucket_id = 'menu-images');
