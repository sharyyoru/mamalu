-- Lead Management Enhancement
-- Links leads to bookings/invoices and adds new statuses

-- 1. Add lead_id to service_bookings for tracking
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_lead ON service_bookings(lead_id);

-- 2. Add lead_id to invoices for tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);
CREATE INDEX IF NOT EXISTS idx_invoices_lead ON invoices(lead_id);

-- 3. Add lead_id to class_bookings for tracking
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_lead ON class_bookings(lead_id);

-- 4. Create lead_bookings table for manual/historical booking entries
CREATE TABLE IF NOT EXISTS public.lead_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    booking_type TEXT NOT NULL, -- 'birthday', 'corporate', 'nanny', 'camp', 'class', 'other'
    description TEXT,
    event_date DATE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status TEXT DEFAULT 'paid', -- 'pending', 'paid', 'partial', 'refunded'
    notes TEXT,
    service_booking_id UUID REFERENCES service_bookings(id), -- Link to actual booking if exists
    invoice_id UUID REFERENCES invoices(id), -- Link to invoice if exists
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_bookings_lead ON lead_bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_bookings_date ON lead_bookings(event_date);

-- 5. Add commission tracking fields to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commission_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;

-- 6. Grant permissions
GRANT ALL ON lead_bookings TO authenticated;
GRANT ALL ON lead_bookings TO service_role;
ALTER TABLE lead_bookings DISABLE ROW LEVEL SECURITY;

-- 7. Update lead_status enum to add sold_hot and sold_cold
-- First check if values exist, then add them
DO $$
BEGIN
    -- Add sold_hot if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sold_hot' AND enumtypid = 'lead_status'::regtype) THEN
        ALTER TYPE lead_status ADD VALUE 'sold_hot';
    END IF;
    -- Add sold_cold if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sold_cold' AND enumtypid = 'lead_status'::regtype) THEN
        ALTER TYPE lead_status ADD VALUE 'sold_cold';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if values already exist
    NULL;
END $$;
