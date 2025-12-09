-- Custom Payment Links System
-- Allows creating shareable Stripe payment links for custom amounts

-- Create payment_links table
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  
  -- Customer info (optional - can be filled when paid)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Stripe
  stripe_payment_link_id TEXT,
  stripe_payment_link_url TEXT,
  stripe_price_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'expired', 'cancelled')),
  
  -- Usage limits
  single_use BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  
  -- Tracking
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(10,2),
  
  -- Reference (optional linking)
  reference_type TEXT, -- 'booking', 'invoice', 'custom', etc.
  reference_id UUID,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_link_code ON public.payment_links(link_code);
CREATE INDEX IF NOT EXISTS idx_payment_links_customer_email ON public.payment_links(customer_email);
CREATE INDEX IF NOT EXISTS idx_payment_links_stripe_payment_link_id ON public.payment_links(stripe_payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON public.payment_links(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can manage payment links" ON public.payment_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
    )
  );

CREATE POLICY "Service role has full access to payment links" ON public.payment_links
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to generate unique link code
CREATE OR REPLACE FUNCTION generate_payment_link_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN 'PAY-' || result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate link code
CREATE OR REPLACE FUNCTION set_payment_link_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.link_code IS NULL THEN
    NEW.link_code := generate_payment_link_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_link_code_trigger
  BEFORE INSERT ON public.payment_links
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_link_code();

-- Update trigger for updated_at
CREATE TRIGGER update_payment_links_updated_at
  BEFORE UPDATE ON public.payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.payment_links IS 'Custom Stripe payment links for ad-hoc payments';
COMMENT ON COLUMN public.payment_links.link_code IS 'Unique shareable code for the payment link (e.g., PAY-ABC123XY)';
COMMENT ON COLUMN public.payment_links.single_use IS 'If true, link becomes inactive after one successful payment';
