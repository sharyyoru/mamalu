-- ===========================================
-- MAMALU KITCHEN - SEED DATA
-- ===========================================
-- Run this AFTER the schema is deployed
-- Backend powered by Mutant
-- ===========================================

-- Insert default location
INSERT INTO public.locations (id, name, slug, address_line1, city, country, phone, email, timezone, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Mamalu Kitchen Dubai',
    'dubai-main',
    '123 Culinary Street, Al Quoz',
    'Dubai',
    'UAE',
    '+971 4 123 4567',
    'hello@mamalukitchen.com',
    'Asia/Dubai',
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- NOTE: Admin users must be created through Supabase Auth
-- ===========================================
-- 
-- To create the admin account for wilson@mutant.ae:
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create New User"
-- 3. Enter email: wilson@mutant.ae
-- 4. Enter a temporary password
-- 5. Copy the User UID that is generated
-- 6. Run the SQL below, replacing the UUID:
--
-- UPDATE public.profiles 
-- SET role = 'super_admin', 
--     full_name = 'Wilson Admin'
-- WHERE email = 'wilson@mutant.ae';
--
-- ===========================================

-- Insert sample class types
INSERT INTO public.class_types (id, location_id, name, slug, description, cuisine_type, skill_level, duration_minutes, max_capacity, price, is_active)
VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Middle Eastern Essentials',
    'middle-eastern-essentials',
    'Master the fundamentals of Middle Eastern cooking including hummus, falafel, and shawarma.',
    'Middle Eastern',
    'beginner',
    180,
    12,
    450.00,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Bread Baking Masterclass',
    'bread-baking-masterclass',
    'From pita to focaccia, learn the art of baking perfect bread every time.',
    'Baking',
    'intermediate',
    240,
    10,
    350.00,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Thai Street Food',
    'thai-street-food',
    'Authentic Thai street food favorites - Pad Thai, Tom Yum, and more.',
    'Thai',
    'beginner',
    180,
    12,
    400.00,
    TRUE
)
ON CONFLICT DO NOTHING;

-- Insert sample kitchen assets
INSERT INTO public.kitchen_assets (id, location_id, asset_type, name, code, description, hourly_rate, daily_rate, status, is_active)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'station',
    'Prep Station A',
    'PREP-A',
    'Full prep station with cutting boards, utensils, and sink access',
    75.00,
    500.00,
    'available',
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'station',
    'Prep Station B',
    'PREP-B',
    'Full prep station with cutting boards, utensils, and sink access',
    75.00,
    500.00,
    'available',
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'equipment',
    'Convection Oven 1',
    'OVEN-1',
    'Commercial convection oven, 10-tray capacity',
    50.00,
    350.00,
    'available',
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'storage',
    'Walk-in Fridge Shelf A',
    'FRIDGE-A',
    'Dedicated shelf space in walk-in refrigerator',
    25.00,
    150.00,
    'available',
    TRUE
)
ON CONFLICT DO NOTHING;

-- Insert sample rental shifts
INSERT INTO public.rental_shifts (id, location_id, name, start_time, end_time, days_available, price_multiplier, is_active)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Morning Shift',
    '06:00',
    '14:00',
    ARRAY[1,2,3,4,5,6,7],
    1.0,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Afternoon Shift',
    '14:00',
    '22:00',
    ARRAY[1,2,3,4,5,6,7],
    1.0,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Night Shift',
    '22:00',
    '06:00',
    ARRAY[1,2,3,4,5,6,7],
    0.8,
    TRUE
)
ON CONFLICT DO NOTHING;

-- Insert sample membership plans
INSERT INTO public.membership_plans (id, location_id, name, description, type, price, billing_interval, class_credits, rental_hours, valid_days, is_active)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '5-Class Pass',
    'Perfect for trying out different cuisines',
    'class_pass',
    1800.00,
    'one_time',
    5,
    NULL,
    90,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Unlimited Monthly',
    'Unlimited class access for serious food enthusiasts',
    'unlimited',
    2500.00,
    'monthly',
    NULL,
    NULL,
    30,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '10-Hour Kitchen Pack',
    'Flexible kitchen rental hours',
    'rental_pack',
    650.00,
    'one_time',
    NULL,
    10,
    180,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Incubator Monthly',
    'Full kitchen access for food entrepreneurs',
    'incubator',
    8000.00,
    'monthly',
    NULL,
    NULL,
    30,
    TRUE
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- DONE! Seed data inserted.
-- ===========================================
