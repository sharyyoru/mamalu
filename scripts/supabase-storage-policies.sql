-- Supabase Storage Policies for Videos Bucket
-- Run this in your Supabase SQL Editor

-- 1. Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'videos';

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public select access" ON storage.objects;

-- 3. Create a comprehensive public read policy
CREATE POLICY "Allow public to read videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- 4. Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%videos%';

-- 5. Check bucket configuration
SELECT id, name, public FROM storage.buckets WHERE id = 'videos';
