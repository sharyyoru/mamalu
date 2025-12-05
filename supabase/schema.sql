-- ===========================================
-- MAMALU KITCHEN - FULL PLATFORM SCHEMA
-- ===========================================
-- Glofox-style Booking & Rental Platform
-- Run this in your Supabase SQL Editor
-- Backend powered by Mutant
-- ===========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For search

-- ===========================================
-- SECTION 1: CORE PLATFORM & CRM
-- ===========================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('customer', 'student', 'renter', 'instructor', 'staff', 'admin', 'super_admin');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');

-- ===========================================
-- LOCATIONS (Multi-location support)
-- ===========================================
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    country TEXT DEFAULT 'UAE',
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Asia/Dubai',
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- PROFILES (Extended CRM)
-- ===========================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    country TEXT DEFAULT 'UAE',
    postal_code TEXT,
    
    -- CRM Fields
    role user_role DEFAULT 'customer',
    skill_level skill_level DEFAULT 'beginner',
    preferred_location_id UUID REFERENCES public.locations(id),
    
    -- Dietary Profile (for students)
    dietary_restrictions TEXT[], -- ['gluten-free', 'nut-allergy', 'vegan']
    dietary_notes TEXT,
    
    -- Renter Compliance
    is_renter_verified BOOLEAN DEFAULT FALSE,
    food_safety_cert_url TEXT,
    food_safety_cert_expiry DATE,
    liability_insurance_url TEXT,
    liability_insurance_expiry DATE,
    business_name TEXT,
    business_license TEXT,
    
    -- Marketing
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    -- Engagement Tracking
    last_booking_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    total_classes_attended INTEGER DEFAULT 0,
    total_spend DECIMAL(10,2) DEFAULT 0,
    
    -- Push notifications
    push_token TEXT,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- LEADS (Sales Funnel)
-- ===========================================
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social', 'event', 'walk_in', 'phone', 'other');

CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    
    -- Contact Info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    
    -- Lead Details
    lead_type TEXT, -- 'student', 'renter', 'event'
    source lead_source DEFAULT 'website',
    status lead_status DEFAULT 'new',
    interest TEXT[], -- ['pasta_classes', 'kitchen_rental', 'private_events']
    
    -- Qualification
    budget_range TEXT,
    timeline TEXT,
    notes TEXT,
    
    -- Assignment
    assigned_to UUID REFERENCES public.profiles(id),
    
    -- Conversion
    converted_to_user_id UUID REFERENCES public.profiles(id),
    converted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- ORDERS TABLE
-- ===========================================
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Shipping info
    shipping_name TEXT,
    shipping_email TEXT,
    shipping_phone TEXT,
    shipping_address_line1 TEXT,
    shipping_address_line2 TEXT,
    shipping_city TEXT,
    shipping_country TEXT DEFAULT 'UAE',
    shipping_postal_code TEXT,
    
    -- Payment info
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Tracking
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- ORDER ITEMS TABLE
-- ===========================================
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- Sanity product ID
    product_title TEXT NOT NULL,
    product_image_url TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- ===========================================
-- CLASS BOOKINGS TABLE
-- ===========================================
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE payment_type AS ENUM ('per_session', 'full_course');

CREATE TABLE public.class_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_number TEXT UNIQUE NOT NULL,
    class_id TEXT NOT NULL, -- Sanity class ID
    class_title TEXT NOT NULL,
    class_type TEXT,
    instructor_name TEXT,
    
    -- Payment details
    payment_type payment_type NOT NULL,
    sessions_booked INTEGER NOT NULL CHECK (sessions_booked > 0),
    total_sessions INTEGER NOT NULL,
    price_per_session DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Status
    status booking_status DEFAULT 'pending',
    
    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Dates
    start_date TIMESTAMPTZ,
    
    -- Contact info
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    attendee_phone TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- Class bookings policies
CREATE POLICY "Users can view own bookings" ON public.class_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.class_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings" ON public.class_bookings
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ===========================================
-- EVENT INQUIRIES TABLE
-- ===========================================
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled');

CREATE TABLE public.event_inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    inquiry_number TEXT UNIQUE NOT NULL,
    
    -- Contact info
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    
    -- Event details
    event_type TEXT NOT NULL,
    event_date DATE,
    guest_count INTEGER,
    location TEXT,
    budget_range TEXT,
    
    -- Requirements
    dietary_requirements TEXT[],
    message TEXT,
    
    -- Status
    status inquiry_status DEFAULT 'new',
    
    -- Follow-up
    assigned_to TEXT,
    quoted_amount DECIMAL(10,2),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_inquiries ENABLE ROW LEVEL SECURITY;

-- Event inquiries policies
CREATE POLICY "Users can view own inquiries" ON public.event_inquiries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create inquiries" ON public.event_inquiries
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- CONSULTANCY INQUIRIES TABLE
-- ===========================================
CREATE TABLE public.consultancy_inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    inquiry_number TEXT UNIQUE NOT NULL,
    
    -- Contact info
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    business_name TEXT,
    
    -- Service details
    service_type TEXT NOT NULL,
    business_type TEXT,
    current_challenges TEXT,
    goals TEXT,
    
    -- Status
    status inquiry_status DEFAULT 'new',
    
    -- Follow-up
    assigned_to TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.consultancy_inquiries ENABLE ROW LEVEL SECURITY;

-- Consultancy inquiries policies
CREATE POLICY "Users can view own consultancy inquiries" ON public.consultancy_inquiries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create consultancy inquiries" ON public.consultancy_inquiries
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- CONTACT MESSAGES TABLE
-- ===========================================
CREATE TABLE public.contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Contact info
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Message
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Contact messages policies
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ===========================================
CREATE TABLE public.newsletter_subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    source TEXT DEFAULT 'website'
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Newsletter policies
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- WISHLISTS TABLE
-- ===========================================
CREATE TABLE public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- Sanity product ID
    product_title TEXT NOT NULL,
    product_image_url TEXT,
    product_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_bookings_updated_at BEFORE UPDATE ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_inquiries_updated_at BEFORE UPDATE ON public.event_inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultancy_inquiries_updated_at BEFORE UPDATE ON public.consultancy_inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'MK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Generate booking number function
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_number = 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_booking_number BEFORE INSERT ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Generate inquiry number function
CREATE OR REPLACE FUNCTION generate_inquiry_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.inquiry_number = 'INQ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_event_inquiry_number BEFORE INSERT ON public.event_inquiries
    FOR EACH ROW EXECUTE FUNCTION generate_inquiry_number();

CREATE TRIGGER set_consultancy_inquiry_number BEFORE INSERT ON public.consultancy_inquiries
    FOR EACH ROW EXECUTE FUNCTION generate_inquiry_number();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_class_bookings_user_id ON public.class_bookings(user_id);
CREATE INDEX idx_class_bookings_status ON public.class_bookings(status);
CREATE INDEX idx_class_bookings_class_id ON public.class_bookings(class_id);
CREATE INDEX idx_event_inquiries_status ON public.event_inquiries(status);
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);

-- ===========================================
-- DONE! Your database is ready.
-- ===========================================
