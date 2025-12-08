-- Add instructor-specific fields to profiles table
-- These fields are only used when role = 'instructor'

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instructor_title TEXT,
ADD COLUMN IF NOT EXISTS instructor_bio TEXT,
ADD COLUMN IF NOT EXISTS instructor_specialties TEXT[],
ADD COLUMN IF NOT EXISTS instructor_experience_years INTEGER,
ADD COLUMN IF NOT EXISTS instructor_image_url TEXT;

-- Create storage policy for instructors bucket (if not exists)
-- Note: The bucket should be created in Supabase dashboard as "instructors"

COMMENT ON COLUMN public.profiles.instructor_title IS 'Professional title for instructors (e.g., Head Chef, Pastry Chef)';
COMMENT ON COLUMN public.profiles.instructor_bio IS 'Biography for instructor profile page';
COMMENT ON COLUMN public.profiles.instructor_specialties IS 'Array of cuisine specialties';
COMMENT ON COLUMN public.profiles.instructor_experience_years IS 'Years of professional experience';
COMMENT ON COLUMN public.profiles.instructor_image_url IS 'URL to instructor profile image in instructors bucket';
