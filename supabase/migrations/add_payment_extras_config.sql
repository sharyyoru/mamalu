-- Create payment_extras table for configurable extras items
-- Allows admins to manage extras like table setup, aprons, mugs, etc.

CREATE TABLE IF NOT EXISTS public.payment_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_extras_is_active ON public.payment_extras(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_extras_sort_order ON public.payment_extras(sort_order);

-- Enable RLS
ALTER TABLE public.payment_extras ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active payment extras" ON public.payment_extras
  FOR SELECT
  USING (is_active = TRUE OR auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
  ));

CREATE POLICY "Staff can manage payment extras" ON public.payment_extras
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
    )
  );

CREATE POLICY "Service role has full access to payment extras" ON public.payment_extras
  FOR ALL
  USING (auth.role() = 'service_role');

-- Update trigger for updated_at
CREATE TRIGGER update_payment_extras_updated_at
  BEFORE UPDATE ON public.payment_extras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default extras
INSERT INTO public.payment_extras (name, description, price, sort_order) VALUES
  ('Table Setup', 'Complete table decoration and setup', 50.00, 1),
  ('Apron (per person)', 'Custom cooking apron for participants', 25.00, 2),
  ('Mug (per person)', 'Souvenir mug for participants', 30.00, 3),
  ('Recipe Book', 'Printed recipe collection book', 75.00, 4),
  ('Additional Ingredients', 'Extra ingredients package', 100.00, 5);

-- Comments
COMMENT ON TABLE public.payment_extras IS 'Configurable extras items for payment links';
COMMENT ON COLUMN public.payment_extras.name IS 'Display name of the extra item';
COMMENT ON COLUMN public.payment_extras.price IS 'Unit price in AED';
COMMENT ON COLUMN public.payment_extras.is_active IS 'Whether this extra is available for selection';
COMMENT ON COLUMN public.payment_extras.sort_order IS 'Display order (lower numbers first)';
