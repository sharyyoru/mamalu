-- Fix RLS for service role
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active menu items" ON menu_items;
DROP POLICY IF EXISTS "Service role full access on menu_items" ON menu_items;

-- Service role bypasses RLS entirely
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Re-enable with proper policies
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read active items
CREATE POLICY "Anyone can read active menu items" ON menu_items
  FOR SELECT USING (is_active = true);

-- Service role (bypasses RLS) - but add explicit policy
CREATE POLICY "Service role full access on menu_items" ON menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- Ensure permissions
GRANT ALL ON menu_items TO authenticated;
GRANT SELECT ON menu_items TO anon;
GRANT ALL ON menu_items TO service_role;
