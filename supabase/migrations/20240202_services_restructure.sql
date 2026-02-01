-- ===========================================
-- MAMALU KITCHEN - SERVICES RESTRUCTURE
-- Kids: Birthday Deck
-- Adults: Corporate Deck, Nanny Class
-- Walk-in Menu
-- ===========================================

-- Service Categories Enum
DO $$ BEGIN
    CREATE TYPE service_category AS ENUM ('kids', 'adults', 'walkin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Service Types Enum
DO $$ BEGIN
    CREATE TYPE service_type AS ENUM (
        'birthday_deck',      -- Kids
        'corporate_deck',     -- Adults
        'nanny_class',        -- Adults
        'walkin_menu'         -- Walk-in
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- SERVICES TABLE (Main service definitions)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category service_category NOT NULL,
    service_type service_type NOT NULL,
    description TEXT,
    short_description TEXT,
    image_url TEXT,
    menu_pdf_url TEXT,
    base_price DECIMAL(10,2),
    price_per_person DECIMAL(10,2),
    min_guests INTEGER DEFAULT 1,
    max_guests INTEGER,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SERVICE PACKAGES (Pricing tiers/packages)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    price_per_person DECIMAL(10,2),
    min_guests INTEGER DEFAULT 1,
    max_guests INTEGER,
    duration_minutes INTEGER,
    includes JSONB DEFAULT '[]',  -- List of what's included
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- MENU ITEMS (Individual items for walk-in and add-ons)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    category TEXT NOT NULL,  -- 'appetizer', 'main', 'dessert', 'drink', 'addon'
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    allergens TEXT[],
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SERVICE BOOKINGS (New booking structure)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Service info
    service_id UUID REFERENCES public.services(id),
    package_id UUID REFERENCES public.service_packages(id),
    service_type service_type NOT NULL,
    service_name TEXT NOT NULL,
    package_name TEXT,
    
    -- Customer info
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company_name TEXT,
    
    -- Event details
    event_date DATE,
    event_time TIME,
    guest_count INTEGER DEFAULT 1,
    
    -- Pricing
    base_amount DECIMAL(10,2) NOT NULL,
    extras_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Items ordered (for walk-in and extras)
    items JSONB DEFAULT '[]',  -- [{item_id, name, quantity, price}]
    extras JSONB DEFAULT '[]',
    
    -- Status
    status booking_status DEFAULT 'pending',
    
    -- Payment
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- QR and check-in
    qr_code_token TEXT DEFAULT uuid_generate_v4()::text,
    checked_in_at TIMESTAMPTZ,
    
    -- Notes
    special_requests TEXT,
    internal_notes TEXT,
    
    -- Corporate menu selection
    menu_id TEXT,
    menu_name TEXT,
    menu_price DECIMAL(10,2),
    
    -- Split payment tracking (for corporate 50% deposit)
    is_deposit_payment BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    balance_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_paid_at TIMESTAMPTZ,
    balance_paid BOOLEAN DEFAULT FALSE,
    balance_paid_at TIMESTAMPTZ,
    balance_payment_link TEXT,
    balance_stripe_session_id TEXT,
    payment_status TEXT DEFAULT 'pending', -- pending, deposit_pending, deposit_paid, balance_pending, fully_paid
    balance_due_date DATE, -- 48 hours before event
    balance_reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SALES ANALYTICS VIEW
-- ===========================================
CREATE OR REPLACE VIEW public.sales_analytics AS
SELECT 
    sb.service_type,
    sb.service_name,
    sb.package_name,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE sb.status IN ('confirmed', 'completed')) as confirmed_bookings,
    SUM(sb.total_amount) FILTER (WHERE sb.status IN ('confirmed', 'completed')) as total_revenue,
    AVG(sb.total_amount) FILTER (WHERE sb.status IN ('confirmed', 'completed')) as avg_order_value,
    SUM(sb.guest_count) FILTER (WHERE sb.status IN ('confirmed', 'completed')) as total_guests,
    DATE_TRUNC('day', sb.created_at) as booking_date
FROM public.service_bookings sb
GROUP BY sb.service_type, sb.service_name, sb.package_name, DATE_TRUNC('day', sb.created_at);

-- ===========================================
-- BEST SELLERS VIEW
-- ===========================================
CREATE OR REPLACE VIEW public.best_sellers AS
SELECT 
    service_type,
    service_name,
    package_name,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    RANK() OVER (PARTITION BY service_type ORDER BY COUNT(*) DESC) as rank_by_orders,
    RANK() OVER (PARTITION BY service_type ORDER BY SUM(total_amount) DESC) as rank_by_revenue
FROM public.service_bookings
WHERE status IN ('confirmed', 'completed')
GROUP BY service_type, service_name, package_name;

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_type ON public.services(service_type);
CREATE INDEX IF NOT EXISTS idx_service_packages_service ON public.service_packages(service_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_service ON public.menu_items(service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_type ON public.service_bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON public.service_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_created ON public.service_bookings(created_at DESC);

-- ===========================================
-- RLS POLICIES
-- ===========================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Services: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff can manage services" ON public.services;
CREATE POLICY "Staff can manage services" ON public.services
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- Packages: Public read
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.service_packages;
CREATE POLICY "Anyone can view active packages" ON public.service_packages
    FOR SELECT USING (is_active = true);

-- Menu items: Public read
DROP POLICY IF EXISTS "Anyone can view available menu items" ON public.menu_items;
CREATE POLICY "Anyone can view available menu items" ON public.menu_items
    FOR SELECT USING (is_available = true);

-- Bookings: User can see own, staff can see all
DROP POLICY IF EXISTS "Users can view own service bookings" ON public.service_bookings;
CREATE POLICY "Users can view own service bookings" ON public.service_bookings
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Anyone can create service bookings" ON public.service_bookings;
CREATE POLICY "Anyone can create service bookings" ON public.service_bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage all bookings" ON public.service_bookings;
CREATE POLICY "Staff can manage all bookings" ON public.service_bookings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin'))
    );

-- ===========================================
-- TRIGGERS
-- ===========================================
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_packages_updated_at ON public.service_packages;
CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON public.service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_bookings_updated_at ON public.service_bookings;
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate booking number for service bookings
CREATE OR REPLACE FUNCTION generate_service_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_number = 'SB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_service_booking_number ON public.service_bookings;
CREATE TRIGGER set_service_booking_number BEFORE INSERT ON public.service_bookings
    FOR EACH ROW EXECUTE FUNCTION generate_service_booking_number();

-- ===========================================
-- SEED DATA: Default Services
-- ===========================================
INSERT INTO public.services (name, slug, category, service_type, description, short_description, menu_pdf_url, base_price, min_guests, max_guests, duration_minutes, display_order, features) VALUES
-- Kids Services
('Birthday Deck', 'birthday-deck', 'kids', 'birthday_deck', 
 'Make your child''s birthday unforgettable with a hands-on cooking party! Our Birthday Deck experience includes cooking activities, decorations, and delicious food prepared by the kids themselves.',
 'Fun cooking birthday parties for kids',
 '/menus/Birthday New .pdf',
 1500, 8, 25, 180, 1,
 '["Private venue", "Dedicated party host", "Cooking activities", "Party decorations", "Photo opportunities", "Take-home treats"]'::jsonb),

-- Adults Services  
('Corporate Deck', 'corporate-deck', 'adults', 'corporate_deck',
 'Team building through cooking! Our Corporate Deck offers unique culinary experiences for companies looking to strengthen their teams while having fun.',
 'Team building cooking experiences',
 '/menus/Corporate deck  New .pdf',
 3000, 10, 50, 240, 1,
 '["Custom menu planning", "Team challenges", "Professional chef guidance", "Corporate branding", "Certificates", "Photo/video package"]'::jsonb),

('Nanny Class', 'nanny-class', 'adults', 'nanny_class',
 'Professional cooking training for nannies and domestic helpers. Learn essential cooking skills, meal planning, and child-friendly recipes.',
 'Professional cooking training for caregivers',
 '/menus/Nanny Course.pdf',
 800, 1, 10, 180, 2,
 '["6-week program", "Certificate upon completion", "Recipe book included", "Meal planning skills", "Child nutrition basics", "Hands-on practice"]'::jsonb),

-- Walk-in Menu
('Walk-in Menu', 'walkin-menu', 'walkin', 'walkin_menu',
 'Drop by and enjoy our delicious menu items! Perfect for families looking for a quick and tasty meal.',
 'Fresh, healthy meals to enjoy on-site or take away',
 '/menus/Walk in Menus-2.pdf',
 0, 1, 20, 60, 1,
 '["Fresh ingredients", "Kid-friendly options", "Healthy choices", "Dine-in or takeaway"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    menu_pdf_url = EXCLUDED.menu_pdf_url,
    features = EXCLUDED.features,
    updated_at = NOW();

-- ===========================================
-- SEED DATA: Service Packages
-- ===========================================

-- Birthday Deck Packages
INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Mini Chef Party',
    'Perfect for smaller celebrations',
    1500,
    150,
    8,
    12,
    120,
    '["2-hour cooking session", "Pizza making activity", "Birthday cake", "Party favors", "Decorations", "Dedicated host"]'::jsonb,
    false,
    1
FROM public.services s WHERE s.slug = 'birthday-deck'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Master Chef Party',
    'Our most popular birthday package',
    2500,
    140,
    12,
    18,
    180,
    '["3-hour cooking session", "Multiple cooking stations", "Birthday cake", "Party favors", "Premium decorations", "Dedicated host", "Photo session", "Take-home recipe cards"]'::jsonb,
    true,
    2
FROM public.services s WHERE s.slug = 'birthday-deck'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Ultimate Chef Experience',
    'The complete birthday celebration',
    3500,
    135,
    18,
    25,
    240,
    '["4-hour full experience", "Gourmet cooking activities", "Custom cake", "Premium party favors", "Luxury decorations", "2 dedicated hosts", "Professional photographer", "Video highlights", "Personalized aprons"]'::jsonb,
    false,
    3
FROM public.services s WHERE s.slug = 'birthday-deck'
ON CONFLICT DO NOTHING;

-- Corporate Deck Packages
INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Team Appetizer',
    'Quick team cooking session',
    3000,
    250,
    10,
    20,
    120,
    '["2-hour session", "Team cooking challenge", "Appetizer preparation", "Team certificates", "Refreshments"]'::jsonb,
    false,
    1
FROM public.services s WHERE s.slug = 'corporate-deck'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Executive Chef Challenge',
    'Full culinary team building experience',
    5000,
    220,
    20,
    35,
    240,
    '["4-hour experience", "Multiple cooking stations", "Team competition", "Full meal preparation", "Certificates and prizes", "Photo package", "Branded aprons"]'::jsonb,
    true,
    2
FROM public.services s WHERE s.slug = 'corporate-deck'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Masterclass Retreat',
    'Premium corporate culinary retreat',
    8000,
    200,
    35,
    50,
    360,
    '["Full day experience", "Gourmet menu creation", "Team competitions", "Award ceremony", "Professional video", "Branded merchandise", "Catered lunch", "Executive certificates"]'::jsonb,
    false,
    3
FROM public.services s WHERE s.slug = 'corporate-deck'
ON CONFLICT DO NOTHING;

-- Nanny Class Packages
INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    'Single Session',
    'Try a single cooking class',
    150,
    150,
    1,
    1,
    180,
    '["3-hour hands-on class", "Recipe booklet", "Ingredients provided", "Certificate of attendance"]'::jsonb,
    false,
    1
FROM public.services s WHERE s.slug = 'nanny-class'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    '4-Week Course',
    'Comprehensive cooking fundamentals',
    500,
    500,
    1,
    1,
    720,
    '["4 weekly sessions", "Meal planning module", "Nutrition basics", "Recipe collection", "Certificate", "WhatsApp support"]'::jsonb,
    true,
    2
FROM public.services s WHERE s.slug = 'nanny-class'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (service_id, name, description, price, price_per_person, min_guests, max_guests, duration_minutes, includes, is_popular, display_order)
SELECT 
    s.id,
    '6-Week Professional',
    'Complete professional training',
    800,
    800,
    1,
    1,
    1080,
    '["6 weekly sessions", "Advanced techniques", "Multiple cuisines", "Child nutrition specialist", "Meal prep mastery", "Professional certificate", "Ongoing support", "Recipe book"]'::jsonb,
    false,
    3
FROM public.services s WHERE s.slug = 'nanny-class'
ON CONFLICT DO NOTHING;

-- ===========================================
-- SEED DATA: Walk-in Menu Items
-- ===========================================
INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, is_popular, display_order)
SELECT s.id, 'appetizer', 'Hummus Platter', 'Classic hummus with warm pita bread', 35, true, true, 1
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, display_order)
SELECT s.id, 'appetizer', 'Fresh Garden Salad', 'Mixed greens with house dressing', 28, true, 2
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_popular, display_order)
SELECT s.id, 'main', 'Kids Pizza', 'Personal pizza with choice of toppings', 45, true, 1
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, display_order)
SELECT s.id, 'main', 'Pasta Bolognese', 'Fresh pasta with meat sauce', 55, 2
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, display_order)
SELECT s.id, 'main', 'Mac & Cheese', 'Creamy homemade mac and cheese', 42, true, 3
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, display_order)
SELECT s.id, 'main', 'Chicken Nuggets', 'Homemade crispy chicken nuggets with fries', 48, 4
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, is_popular, display_order)
SELECT s.id, 'dessert', 'Chocolate Brownie', 'Warm brownie with ice cream', 32, true, true, 1
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, display_order)
SELECT s.id, 'dessert', 'Fruit Cup', 'Fresh seasonal fruits', 25, true, 2
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, display_order)
SELECT s.id, 'drink', 'Fresh Juice', 'Orange, apple, or mixed berry', 18, true, 1
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_items (service_id, category, name, description, price, is_vegetarian, display_order)
SELECT s.id, 'drink', 'Smoothie', 'Strawberry, banana, or mango', 22, true, 2
FROM public.services s WHERE s.slug = 'walkin-menu'
ON CONFLICT DO NOTHING;

-- Done!
