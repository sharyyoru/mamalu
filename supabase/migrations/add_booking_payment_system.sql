-- Enhanced booking system with Stripe, cash payments, and invoicing
-- Run this migration in Supabase SQL Editor

-- Add payment-related columns to class_bookings
ALTER TABLE public.class_bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending' CHECK (payment_method IN ('stripe', 'cash', 'pending', 'invoice')),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receipt_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receipt_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receipt_verified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invoice_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Create invoices table for tracking sent invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  booking_id UUID REFERENCES public.class_bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  description TEXT,
  line_items JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'cancelled', 'overdue')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'pending')),
  payment_link TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  due_date TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_transactions table for full audit trail
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.class_bookings(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'partial_refund')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cash')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  receipt_url TEXT,
  receipt_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_bookings_payment_method ON public.class_bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_class_bookings_stripe_session ON public.class_bookings(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_invoice_number ON public.class_bookings(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON public.invoices(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);

-- Add RLS policies for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow admin/staff to manage invoices
CREATE POLICY "Staff can manage invoices" ON public.invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'instructor')
    )
  );

-- Allow customers to view their own invoices
CREATE POLICY "Customers can view own invoices" ON public.invoices
  FOR SELECT
  USING (customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Add RLS policies for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow admin/staff to manage transactions
CREATE POLICY "Staff can manage transactions" ON public.payment_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'instructor')
    )
  );

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_invoice_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  new_invoice_number := 'INV-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.invoices IS 'Invoice records for bookings and custom charges';
COMMENT ON TABLE public.payment_transactions IS 'Full audit trail of all payment transactions';
COMMENT ON COLUMN public.class_bookings.payment_method IS 'Payment method: stripe, cash, pending, or invoice';
COMMENT ON COLUMN public.class_bookings.receipt_url IS 'URL to uploaded cash payment receipt in cash-receipts bucket';
COMMENT ON COLUMN public.class_bookings.receipt_verified IS 'Whether staff has verified the cash receipt';
COMMENT ON COLUMN public.class_bookings.payment_link IS 'Stripe payment link for invoice-based payments';
