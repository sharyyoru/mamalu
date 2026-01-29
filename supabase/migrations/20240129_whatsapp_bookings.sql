-- ===========================================
-- WHATSAPP BOOKINGS & BOT SUPPORT
-- ===========================================
-- Run this in Supabase SQL Editor

-- Add booking_source column to class_bookings if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'booking_source') THEN
        ALTER TABLE public.class_bookings ADD COLUMN booking_source TEXT DEFAULT 'website';
    END IF;
END $$;

-- Add bot_enabled column to whatsapp_accounts if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_accounts' AND column_name = 'bot_enabled') THEN
        ALTER TABLE public.whatsapp_accounts ADD COLUMN bot_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'whatsapp_accounts' AND column_name = 'access_token') THEN
        ALTER TABLE public.whatsapp_accounts ADD COLUMN access_token TEXT;
    END IF;
END $$;

-- WhatsApp Bookings Table - Track bookings made via WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.class_bookings(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    booking_number TEXT NOT NULL,
    class_title TEXT NOT NULL,
    total_amount DECIMAL(10,2),
    conversation_log JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_bookings
CREATE POLICY "Staff can view whatsapp bookings" ON public.whatsapp_bookings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

CREATE POLICY "Service role can manage whatsapp bookings" ON public.whatsapp_bookings
    FOR ALL USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_bookings_phone ON public.whatsapp_bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bookings_booking_id ON public.whatsapp_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_source ON public.class_bookings(booking_source);

-- ===========================================
-- BOOKING CHECKINS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.booking_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.class_bookings(id) ON DELETE CASCADE,
    guest_id UUID,
    checked_in_by UUID REFERENCES public.profiles(id),
    check_in_method TEXT DEFAULT 'manual', -- qr_scan, manual, bulk
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.booking_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view checkins" ON public.booking_checkins
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

CREATE POLICY "Staff can create checkins" ON public.booking_checkins
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- Index
CREATE INDEX IF NOT EXISTS idx_booking_checkins_booking_id ON public.booking_checkins(booking_id);

-- ===========================================
-- ADD MISSING COLUMNS TO CLASS_BOOKINGS
-- ===========================================
DO $$ 
BEGIN
    -- QR code columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'qr_code_token') THEN
        ALTER TABLE public.class_bookings ADD COLUMN qr_code_token TEXT UNIQUE;
    END IF;
    
    -- Check-in columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'checked_in_at') THEN
        ALTER TABLE public.class_bookings ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'checked_in_by') THEN
        ALTER TABLE public.class_bookings ADD COLUMN checked_in_by UUID REFERENCES public.profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'guests_checked_in') THEN
        ALTER TABLE public.class_bookings ADD COLUMN guests_checked_in INTEGER DEFAULT 0;
    END IF;
    
    -- Guest columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'number_of_guests') THEN
        ALTER TABLE public.class_bookings ADD COLUMN number_of_guests INTEGER DEFAULT 1;
    END IF;
    
    -- Payment columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'amount_due') THEN
        ALTER TABLE public.class_bookings ADD COLUMN amount_due DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'amount_paid') THEN
        ALTER TABLE public.class_bookings ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'payment_method') THEN
        ALTER TABLE public.class_bookings ADD COLUMN payment_method TEXT DEFAULT 'pending';
    END IF;
    
    -- Waiver columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'waiver_accepted') THEN
        ALTER TABLE public.class_bookings ADD COLUMN waiver_accepted BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'waiver_signature') THEN
        ALTER TABLE public.class_bookings ADD COLUMN waiver_signature TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'waiver_signed_at') THEN
        ALTER TABLE public.class_bookings ADD COLUMN waiver_signed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'class_bookings' AND column_name = 'terms_version') THEN
        ALTER TABLE public.class_bookings ADD COLUMN terms_version TEXT DEFAULT '1.0';
    END IF;
END $$;

-- ===========================================
-- BOOKING GUESTS TABLE (Individual QR per guest)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.booking_guests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.class_bookings(id) ON DELETE CASCADE,
    guest_number INTEGER NOT NULL,
    guest_name TEXT,
    qr_code_token TEXT UNIQUE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view booking guests" ON public.booking_guests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

CREATE POLICY "Service role can manage booking guests" ON public.booking_guests
    FOR ALL USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_booking_guests_booking_id ON public.booking_guests(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_guests_qr_token ON public.booking_guests(qr_code_token);

-- ===========================================
-- FUNCTION: Generate QR token on booking creation
-- ===========================================
CREATE OR REPLACE FUNCTION generate_booking_qr_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code_token IS NULL THEN
        NEW.qr_code_token = encode(gen_random_bytes(16), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_booking_qr_token ON public.class_bookings;
CREATE TRIGGER set_booking_qr_token
    BEFORE INSERT ON public.class_bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_qr_token();

-- ===========================================
-- FUNCTION: Increment guests checked in
-- ===========================================
CREATE OR REPLACE FUNCTION increment_guests_checked_in(booking_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.class_bookings
    SET guests_checked_in = COALESCE(guests_checked_in, 0) + 1
    WHERE id = booking_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DONE
-- ===========================================
