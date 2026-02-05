-- Update invoices table to add service_booking and payment_link associations
-- Also add line_items JSONB column if not exists

-- Add service_booking_id column (for new service bookings)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_booking_id UUID REFERENCES service_bookings(id);

-- Add payment_link_id column
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id);

-- Add line_items column for itemized invoice
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items JSONB;

-- Add created_by for tracking who created the invoice
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add service details for display
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS guest_count INTEGER;

-- Add extras total tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS extras_amount DECIMAL(10,2);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_service_booking ON invoices(service_booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_link ON invoices(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Add invoice reference columns to service_bookings
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Add invoice reference column to payment_links
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);

-- Create invoice number generator function if not exists
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  seq_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-' || year_suffix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_suffix || '-%';
  
  invoice_num := 'INV-' || year_suffix || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;
