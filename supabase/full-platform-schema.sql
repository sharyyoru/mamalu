-- ===========================================
-- MAMALU KITCHEN - FULL PLATFORM SCHEMA
-- ===========================================
-- Glofox-style Booking & Rental Platform
-- Run this in your Supabase SQL Editor
-- Backend powered by Mutant
-- ===========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ███████████████████████████████████████████
-- SECTION 1: ENUMS & TYPES
-- ███████████████████████████████████████████

CREATE TYPE user_role AS ENUM ('customer', 'student', 'renter', 'instructor', 'staff', 'admin', 'super_admin');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social', 'event', 'walk_in', 'phone', 'other');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'refunded', 'failed');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE rental_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE asset_type AS ENUM ('station', 'equipment', 'storage', 'room');
CREATE TYPE asset_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');
CREATE TYPE membership_type AS ENUM ('class_pass', 'unlimited', 'rental_pack', 'incubator');
CREATE TYPE notification_type AS ENUM ('booking', 'reminder', 'marketing', 'system', 'waitlist');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- ███████████████████████████████████████████
-- SECTION 2: CORE PLATFORM
-- ███████████████████████████████████████████

-- LOCATIONS (Multi-location)
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT DEFAULT 'Dubai',
    country TEXT DEFAULT 'UAE',
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Asia/Dubai',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    operating_hours JSONB DEFAULT '{}', -- {"mon": {"open": "06:00", "close": "22:00"}}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Extended CRM)
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
    
    -- Role & Skills
    role user_role DEFAULT 'customer',
    skill_level skill_level DEFAULT 'beginner',
    preferred_location_id UUID REFERENCES public.locations(id),
    
    -- Dietary Profile (Students)
    dietary_restrictions TEXT[],
    dietary_notes TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    
    -- Renter Compliance Vault
    is_renter_verified BOOLEAN DEFAULT FALSE,
    food_safety_cert_url TEXT,
    food_safety_cert_expiry DATE,
    liability_insurance_url TEXT,
    liability_insurance_expiry DATE,
    business_name TEXT,
    business_license_number TEXT,
    business_license_url TEXT,
    
    -- Instructor Info
    is_instructor BOOLEAN DEFAULT FALSE,
    instructor_bio TEXT,
    instructor_specialties TEXT[],
    hourly_rate DECIMAL(10,2),
    
    -- Referral Program
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    referral_credits DECIMAL(10,2) DEFAULT 0,
    
    -- Engagement Tracking
    last_booking_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    total_classes_attended INTEGER DEFAULT 0,
    total_rental_hours INTEGER DEFAULT 0,
    total_spend DECIMAL(10,2) DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    
    -- Notification Preferences
    push_token TEXT,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS (Sales Funnel)
CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    lead_type TEXT,
    source lead_source DEFAULT 'website',
    status lead_status DEFAULT 'new',
    interests TEXT[],
    budget_range TEXT,
    timeline TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    converted_to_user_id UUID REFERENCES public.profiles(id),
    converted_at TIMESTAMPTZ,
    last_contacted_at TIMESTAMPTZ,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ███████████████████████████████████████████
-- SECTION 3: CLASS BOOKING MODULE
-- ███████████████████████████████████████████

-- INSTRUCTORS (Chef assignments)
CREATE TABLE public.instructors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id),
    display_name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    specialties TEXT[],
    hourly_rate DECIMAL(10,2),
    is_substitute BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLASS TYPES (Templates)
CREATE TABLE public.class_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    sanity_id TEXT, -- Link to Sanity CMS
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    cuisine_type TEXT,
    skill_level skill_level DEFAULT 'beginner',
    duration_minutes INTEGER DEFAULT 180,
    max_capacity INTEGER DEFAULT 12,
    stations_required INTEGER DEFAULT 6,
    price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Prep requirements
    prep_time_hours DECIMAL(4,2) DEFAULT 2,
    cleanup_time_minutes INTEGER DEFAULT 30,
    
    -- Policies
    cancellation_hours INTEGER DEFAULT 24,
    cancellation_fee_percent INTEGER DEFAULT 50,
    min_age INTEGER,
    
    -- Content
    image_url TEXT,
    what_you_learn TEXT[],
    ingredients_provided TEXT[],
    what_to_bring TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSE SERIES (Multi-week programs)
CREATE TABLE public.course_series (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    name TEXT NOT NULL,
    description TEXT,
    total_sessions INTEGER NOT NULL,
    price_full_series DECIMAL(10,2) NOT NULL,
    price_per_session DECIMAL(10,2),
    discount_percent INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLASS SESSIONS (Scheduled instances)
CREATE TABLE public.class_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) NOT NULL,
    class_type_id UUID REFERENCES public.class_types(id) NOT NULL,
    course_series_id UUID REFERENCES public.course_series(id),
    instructor_id UUID REFERENCES public.instructors(id),
    substitute_instructor_id UUID REFERENCES public.instructors(id),
    
    -- Scheduling
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Capacity
    max_capacity INTEGER NOT NULL,
    spots_booked INTEGER DEFAULT 0,
    spots_available INTEGER GENERATED ALWAYS AS (max_capacity - spots_booked) STORED,
    
    -- Pricing (can override class_type)
    price_override DECIMAL(10,2),
    
    -- Status
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    cancelled_reason TEXT,
    
    -- Waitlist
    waitlist_enabled BOOLEAN DEFAULT TRUE,
    waitlist_count INTEGER DEFAULT 0,
    
    -- Prep Sheet
    prep_sheet_generated BOOLEAN DEFAULT FALSE,
    prep_notes TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLASS BOOKINGS
CREATE TABLE public.class_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    class_session_id UUID REFERENCES public.class_sessions(id) NOT NULL,
    course_series_id UUID REFERENCES public.course_series(id),
    
    -- Booking details
    spots_booked INTEGER DEFAULT 1,
    station_number INTEGER,
    status booking_status DEFAULT 'pending',
    
    -- Group/Family booking
    is_group_booking BOOLEAN DEFAULT FALSE,
    group_size INTEGER DEFAULT 1,
    additional_attendees JSONB, -- [{name, dietary}]
    booked_by_user_id UUID REFERENCES public.profiles(id),
    
    -- Dietary flags
    dietary_flags TEXT[],
    special_requests TEXT,
    
    -- Payment
    payment_status payment_status DEFAULT 'pending',
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(10,2) NOT NULL,
    stripe_payment_intent_id TEXT,
    membership_id UUID, -- If using class pass
    
    -- Attendance
    checked_in_at TIMESTAMPTZ,
    no_show BOOLEAN DEFAULT FALSE,
    
    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Waitlist
    waitlist_position INTEGER,
    promoted_from_waitlist_at TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLASS WAITLIST
CREATE TABLE public.class_waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    position INTEGER NOT NULL,
    spots_requested INTEGER DEFAULT 1,
    notified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    promoted_to_booking_id UUID REFERENCES public.class_bookings(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PREP SHEETS (Auto-generated ingredient lists)
CREATE TABLE public.prep_sheets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    student_count INTEGER NOT NULL,
    ingredients JSONB NOT NULL, -- [{item, amount_per_person, total_amount, unit}]
    equipment_needed TEXT[],
    prep_instructions TEXT,
    porter_notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
    completed_by UUID REFERENCES public.profiles(id),
    completed_at TIMESTAMPTZ
);

-- RECIPE LOCKER (Post-class content access)
CREATE TABLE public.recipe_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_type_id UUID REFERENCES public.class_types(id),
    booking_id UUID REFERENCES public.class_bookings(id),
    sanity_recipe_ids TEXT[], -- Links to Sanity recipes
    video_urls TEXT[],
    pdf_url TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- NULL = never expires
);

-- ███████████████████████████████████████████
-- SECTION 4: KITCHEN RENTAL MODULE
-- ███████████████████████████████████████████

-- KITCHEN ASSETS (Stations, Equipment, Storage)
CREATE TABLE public.kitchen_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) NOT NULL,
    asset_type asset_type NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- "PREP-A", "OVEN-2", "FRIDGE-SHELF-3"
    description TEXT,
    
    -- Specifications
    specs JSONB, -- {dimensions, capacity, power_requirements}
    
    -- Rental pricing
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    minimum_hours INTEGER DEFAULT 1,
    
    -- For storage: size
    storage_cubic_feet DECIMAL(6,2),
    shelf_count INTEGER,
    
    -- Position on floor map
    floor_map_x INTEGER,
    floor_map_y INTEGER,
    floor_map_width INTEGER,
    floor_map_height INTEGER,
    
    -- Maintenance
    status asset_status DEFAULT 'available',
    last_maintenance_at TIMESTAMPTZ,
    next_maintenance_at TIMESTAMPTZ,
    usage_hours INTEGER DEFAULT 0,
    maintenance_interval_hours INTEGER DEFAULT 500,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTAL SHIFTS (Time blocks)
CREATE TABLE public.rental_shifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) NOT NULL,
    name TEXT NOT NULL, -- "Morning Shift", "Night Shift"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_available INTEGER[], -- [1,2,3,4,5] = Mon-Fri
    price_multiplier DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE
);

-- RENTAL BOOKINGS
CREATE TABLE public.rental_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    location_id UUID REFERENCES public.locations(id) NOT NULL,
    
    -- Time
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift_id UUID REFERENCES public.rental_shifts(id),
    
    -- Status
    status rental_status DEFAULT 'pending',
    
    -- Payment
    subtotal DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    membership_id UUID,
    
    -- Access Control
    access_code TEXT, -- PIN or QR code
    access_code_expires_at TIMESTAMPTZ,
    
    -- Check in/out
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES public.profiles(id),
    checked_out_at TIMESTAMPTZ,
    checked_out_by UUID REFERENCES public.profiles(id),
    
    -- Checklist status
    pre_check_completed BOOLEAN DEFAULT FALSE,
    post_check_completed BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTAL BOOKING ITEMS (Assets booked)
CREATE TABLE public.rental_booking_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_booking_id UUID REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.kitchen_assets(id),
    quantity INTEGER DEFAULT 1,
    hours DECIMAL(4,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EQUIPMENT ADD-ONS (Specialty gear rental)
CREATE TABLE public.equipment_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_booking_id UUID REFERENCES public.rental_bookings(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.kitchen_assets(id),
    name TEXT NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INCIDENT REPORTS
CREATE TABLE public.incident_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    reported_by UUID REFERENCES public.profiles(id),
    rental_booking_id UUID REFERENCES public.rental_bookings(id),
    asset_id UUID REFERENCES public.kitchen_assets(id),
    
    incident_type TEXT NOT NULL, -- 'equipment_damage', 'cleanliness', 'safety', 'other'
    severity incident_severity DEFAULT 'medium',
    description TEXT NOT NULL,
    photos TEXT[],
    
    -- Resolution
    status TEXT DEFAULT 'open', -- open, investigating, resolved, closed
    assigned_to UUID REFERENCES public.profiles(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Financial
    damage_cost DECIMAL(10,2),
    charged_to_user BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MAINTENANCE LOG
CREATE TABLE public.maintenance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    asset_id UUID REFERENCES public.kitchen_assets(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL, -- 'scheduled', 'repair', 'inspection'
    description TEXT,
    performed_by TEXT,
    cost DECIMAL(10,2),
    parts_replaced TEXT[],
    next_maintenance_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ███████████████████████████████████████████
-- SECTION 5: MEMBERSHIPS & PAYMENTS
-- ███████████████████████████████████████████

-- MEMBERSHIP PLANS
CREATE TABLE public.membership_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    name TEXT NOT NULL,
    description TEXT,
    type membership_type NOT NULL,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    billing_interval TEXT, -- 'monthly', 'yearly', 'one_time'
    
    -- Limits
    class_credits INTEGER, -- NULL = unlimited
    rental_hours INTEGER,
    valid_days INTEGER, -- For passes: days until expiry
    
    -- Features
    features JSONB, -- {priority_booking: true, guest_passes: 2}
    
    -- Stripe
    stripe_price_id TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER MEMBERSHIPS
CREATE TABLE public.user_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.membership_plans(id),
    
    -- Status
    status TEXT DEFAULT 'active', -- active, paused, cancelled, expired
    
    -- Usage
    classes_remaining INTEGER,
    rental_hours_remaining INTEGER,
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    cancelled_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    resume_date DATE,
    
    -- Stripe subscription
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    
    -- Billing
    next_billing_date DATE,
    amount DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS (E-commerce)
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    location_id UUID REFERENCES public.locations(id),
    
    status order_status DEFAULT 'pending',
    
    -- Totals
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    
    -- Discount
    discount_code TEXT,
    discount_id UUID,
    
    -- Shipping
    shipping_name TEXT,
    shipping_email TEXT,
    shipping_phone TEXT,
    shipping_address JSONB,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Payment
    payment_status payment_status DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Split payments
    split_payment_enabled BOOLEAN DEFAULT FALSE,
    split_participants JSONB, -- [{user_id, amount, paid}]
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_image_url TEXT,
    sku TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISCOUNT CODES
CREATE TABLE public.discount_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'percent', 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2),
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    applies_to TEXT, -- 'all', 'classes', 'products', 'rentals'
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ███████████████████████████████████████████
-- SECTION 6: MARKETING & NOTIFICATIONS
-- ███████████████████████████████████████████

-- REFERRAL REWARDS
CREATE TABLE public.referral_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES public.profiles(id),
    referred_id UUID REFERENCES public.profiles(id),
    reward_type TEXT, -- 'credit', 'discount', 'free_class'
    reward_value DECIMAL(10,2),
    status TEXT DEFAULT 'pending', -- pending, credited, expired
    credited_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    channel TEXT NOT NULL, -- 'push', 'email', 'sms'
    
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, sent, failed, read
    read_at TIMESTAMPTZ,
    error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING CAMPAIGNS
CREATE TABLE public.marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'win_back', 'promo', 'announcement'
    
    -- Targeting
    target_segment TEXT, -- 'inactive_30d', 'new_users', 'all'
    target_user_ids UUID[],
    
    -- Content
    email_subject TEXT,
    email_body TEXT,
    push_title TEXT,
    push_body TEXT,
    sms_body TEXT,
    
    -- Offer
    discount_code_id UUID REFERENCES public.discount_codes(id),
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Stats
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'draft', -- draft, scheduled, sent, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE public.newsletter_subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'website',
    interests TEXT[],
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- ███████████████████████████████████████████
-- SECTION 7: CONTACT & INQUIRIES
-- ███████████████████████████████████████████

-- EVENT INQUIRIES
CREATE TABLE public.event_inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inquiry_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    location_id UUID REFERENCES public.locations(id),
    
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    
    event_type TEXT NOT NULL,
    event_date DATE,
    guest_count INTEGER,
    budget_range TEXT,
    dietary_requirements TEXT[],
    message TEXT,
    
    status lead_status DEFAULT 'new',
    assigned_to UUID REFERENCES public.profiles(id),
    quoted_amount DECIMAL(10,2),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSULTANCY INQUIRIES
CREATE TABLE public.consultancy_inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inquiry_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    business_name TEXT,
    
    service_type TEXT NOT NULL,
    business_type TEXT,
    current_challenges TEXT,
    goals TEXT,
    
    status lead_status DEFAULT 'new',
    assigned_to UUID REFERENCES public.profiles(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WISHLISTS
CREATE TABLE public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_image_url TEXT,
    product_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ███████████████████████████████████████████
-- SECTION 8: ANALYTICS & REPORTING
-- ███████████████████████████████████████████

-- ANALYTICS EVENTS
CREATE TABLE public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY METRICS (Pre-aggregated)
CREATE TABLE public.daily_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id),
    date DATE NOT NULL,
    
    -- Revenue
    class_revenue DECIMAL(10,2) DEFAULT 0,
    rental_revenue DECIMAL(10,2) DEFAULT 0,
    product_revenue DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Bookings
    class_bookings INTEGER DEFAULT 0,
    rental_bookings INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    
    -- Occupancy
    class_occupancy_percent DECIMAL(5,2) DEFAULT 0,
    rental_occupancy_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Engagement
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    
    UNIQUE(location_id, date)
);

-- ███████████████████████████████████████████
-- SECTION 9: FUNCTIONS & TRIGGERS
-- ███████████████████████████████████████████

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate unique codes
CREATE OR REPLACE FUNCTION generate_code(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking numbers
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_number = generate_code('BK');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = generate_code('MK');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_inquiry_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.inquiry_number = generate_code('INQ');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.referral_code = UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT), 1, 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update class session spots
CREATE OR REPLACE FUNCTION update_class_spots()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status IN ('pending', 'confirmed') THEN
        UPDATE public.class_sessions 
        SET spots_booked = spots_booked + NEW.spots_booked
        WHERE id = NEW.class_session_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled', 'no_show') THEN
        UPDATE public.class_sessions 
        SET spots_booked = spots_booked - OLD.spots_booked
        WHERE id = NEW.class_session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Process waitlist when spot opens
CREATE OR REPLACE FUNCTION process_waitlist()
RETURNS TRIGGER AS $$
DECLARE
    next_waitlist RECORD;
BEGIN
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled' THEN
        SELECT * INTO next_waitlist
        FROM public.class_waitlist
        WHERE class_session_id = NEW.class_session_id
          AND promoted_to_booking_id IS NULL
        ORDER BY position ASC
        LIMIT 1;
        
        IF FOUND THEN
            -- Create notification for waitlist promotion
            INSERT INTO public.notifications (user_id, type, channel, title, body, data)
            VALUES (
                next_waitlist.user_id,
                'waitlist',
                'push',
                'Spot Available!',
                'A spot has opened up for your waitlisted class. Book now before it fills up!',
                jsonb_build_object('class_session_id', NEW.class_session_id, 'waitlist_id', next_waitlist.id)
            );
            
            UPDATE public.class_waitlist 
            SET notified_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'
            WHERE id = next_waitlist.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_sessions_timestamp BEFORE UPDATE ON public.class_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_bookings_timestamp BEFORE UPDATE ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_bookings_timestamp BEFORE UPDATE ON public.rental_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_class_booking_number BEFORE INSERT ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION set_booking_number();

CREATE TRIGGER set_rental_booking_number BEFORE INSERT ON public.rental_bookings
    FOR EACH ROW EXECUTE FUNCTION set_booking_number();

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

CREATE TRIGGER set_event_inquiry_number BEFORE INSERT ON public.event_inquiries
    FOR EACH ROW EXECUTE FUNCTION set_inquiry_number();

CREATE TRIGGER set_consultancy_inquiry_number BEFORE INSERT ON public.consultancy_inquiries
    FOR EACH ROW EXECUTE FUNCTION set_inquiry_number();

CREATE TRIGGER set_referral_code BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_class_booking_change AFTER INSERT OR UPDATE ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION update_class_spots();

CREATE TRIGGER on_booking_cancelled AFTER UPDATE ON public.class_bookings
    FOR EACH ROW EXECUTE FUNCTION process_waitlist();

-- ███████████████████████████████████████████
-- SECTION 10: ROW LEVEL SECURITY
-- ███████████████████████████████████████████

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view locations" ON public.locations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view class types" ON public.class_types FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view class sessions" ON public.class_sessions FOR SELECT USING (TRUE);
CREATE POLICY "Public can view instructors" ON public.instructors FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view kitchen assets" ON public.kitchen_assets FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view membership plans" ON public.membership_plans FOR SELECT USING (is_active = TRUE);

-- User policies
CREATE POLICY "Users own bookings" ON public.class_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own rental bookings" ON public.rental_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own orders" ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own memberships" ON public.user_memberships FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own wishlists" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own waitlist" ON public.class_waitlist FOR ALL USING (auth.uid() = user_id);

-- Public insert policies
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can submit event inquiry" ON public.event_inquiries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can submit consultancy inquiry" ON public.consultancy_inquiries FOR INSERT WITH CHECK (TRUE);

-- ███████████████████████████████████████████
-- SECTION 11: INDEXES
-- ███████████████████████████████████████████

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_class_sessions_date ON public.class_sessions(session_date);
CREATE INDEX idx_class_sessions_type ON public.class_sessions(class_type_id);
CREATE INDEX idx_class_bookings_user ON public.class_bookings(user_id);
CREATE INDEX idx_class_bookings_session ON public.class_bookings(class_session_id);
CREATE INDEX idx_class_bookings_status ON public.class_bookings(status);
CREATE INDEX idx_rental_bookings_user ON public.rental_bookings(user_id);
CREATE INDEX idx_rental_bookings_date ON public.rental_bookings(booking_date);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX idx_daily_metrics_date ON public.daily_metrics(date);

-- Full-text search
CREATE INDEX idx_profiles_search ON public.profiles USING gin(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(email, '')));
CREATE INDEX idx_leads_search ON public.leads USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(company, '')));

-- ███████████████████████████████████████████
-- DONE! Full platform schema ready.
-- ███████████████████████████████████████████
