-- ===========================================
-- COMPLETE FIX: class_bookings table
-- Run this in Supabase SQL Editor
-- ===========================================

-- Step 1: Disable RLS temporarily
ALTER TABLE public.class_bookings DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic column if it exists
ALTER TABLE public.class_bookings DROP COLUMN IF EXISTS class_session_id;

-- Step 3: Make sure all required columns exist and allow NULLs where needed
-- First, drop NOT NULL constraints that cause issues
ALTER TABLE public.class_bookings ALTER COLUMN booking_number DROP NOT NULL;
ALTER TABLE public.class_bookings ALTER COLUMN class_type DROP NOT NULL;

-- Step 4: Add new payment columns for our booking system
ALTER TABLE public.class_bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receipt_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receipt_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receipt_verified_by UUID,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Step 5: Grant permissions
GRANT ALL ON public.class_bookings TO authenticated;
GRANT ALL ON public.class_bookings TO anon;
GRANT ALL ON public.class_bookings TO service_role;

-- Step 6: Create invoices table if not exists
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  booking_id UUID REFERENCES public.class_bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  description TEXT,
  line_items JSONB,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_link TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  due_date TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO anon;
GRANT ALL ON public.invoices TO service_role;

-- Step 7: Create payment_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.class_bookings(id) ON DELETE SET NULL,
  invoice_id UUID,
  transaction_type TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  receipt_url TEXT,
  receipt_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  processed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_transactions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO anon;
GRANT ALL ON public.payment_transactions TO service_role;
