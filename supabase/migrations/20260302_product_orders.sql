-- Product Orders table for shop purchases
CREATE TABLE IF NOT EXISTS product_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  
  -- Delivery address from Stripe
  shipping_address JSONB,
  shipping_city VARCHAR(100),
  shipping_country VARCHAR(100),
  
  -- Order details
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
  
  -- Payment info
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Fulfillment
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  tracking_number VARCHAR(100),
  
  -- Notifications
  is_new BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_payment_status ON product_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_product_orders_is_new ON product_orders(is_new);
CREATE INDEX IF NOT EXISTS idx_product_orders_created_at ON product_orders(created_at DESC);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_number VARCHAR(20);
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM product_orders;
  new_number := 'ORD-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON product_orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON product_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_product_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_orders_updated_at ON product_orders;
CREATE TRIGGER trigger_update_product_orders_updated_at
  BEFORE UPDATE ON product_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_orders_updated_at();

-- RLS policies
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to product_orders"
  ON product_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Users can view own orders"
  ON product_orders
  FOR SELECT
  TO authenticated
  USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
