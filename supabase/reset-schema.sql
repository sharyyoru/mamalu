-- ===========================================
-- MAMALU KITCHEN - RESET SCHEMA
-- ===========================================
-- Run this FIRST to clear existing schema
-- Then run full-platform-schema.sql
-- ===========================================

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.daily_metrics CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.consultancy_inquiries CASCADE;
DROP TABLE IF EXISTS public.event_inquiries CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.marketing_campaigns CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.referral_rewards CASCADE;
DROP TABLE IF EXISTS public.discount_codes CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.user_memberships CASCADE;
DROP TABLE IF EXISTS public.membership_plans CASCADE;
DROP TABLE IF EXISTS public.maintenance_logs CASCADE;
DROP TABLE IF EXISTS public.incident_reports CASCADE;
DROP TABLE IF EXISTS public.equipment_addons CASCADE;
DROP TABLE IF EXISTS public.rental_booking_items CASCADE;
DROP TABLE IF EXISTS public.rental_bookings CASCADE;
DROP TABLE IF EXISTS public.rental_shifts CASCADE;
DROP TABLE IF EXISTS public.kitchen_assets CASCADE;
DROP TABLE IF EXISTS public.recipe_access CASCADE;
DROP TABLE IF EXISTS public.prep_sheets CASCADE;
DROP TABLE IF EXISTS public.class_waitlist CASCADE;
DROP TABLE IF EXISTS public.class_bookings CASCADE;
DROP TABLE IF EXISTS public.class_sessions CASCADE;
DROP TABLE IF EXISTS public.course_series CASCADE;
DROP TABLE IF EXISTS public.class_types CASCADE;
DROP TABLE IF EXISTS public.instructors CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- Drop all custom types/enums
DROP TYPE IF EXISTS incident_severity CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS membership_type CASCADE;
DROP TYPE IF EXISTS asset_status CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS rental_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS skill_level CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_code(TEXT) CASCADE;
DROP FUNCTION IF EXISTS set_booking_number() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS set_inquiry_number() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_class_spots() CASCADE;
DROP FUNCTION IF EXISTS process_waitlist() CASCADE;

-- ===========================================
-- DONE! Now run full-platform-schema.sql
-- ===========================================
