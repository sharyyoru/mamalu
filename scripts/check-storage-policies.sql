-- Check Storage Policies
-- Run this in Supabase SQL Editor to see what policies exist

-- 1. Check all policies on storage.objects table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 2. Check bucket configuration
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 3. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 4. List all files in videos bucket (as superuser)
SELECT 
    name,
    id,
    bucket_id,
    created_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'videos'
LIMIT 10;
