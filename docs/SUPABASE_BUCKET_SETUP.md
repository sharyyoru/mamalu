# Supabase Storage Bucket Setup Guide

## Issue: "Videos bucket not found" or "No videos available"

This happens when the Supabase storage bucket doesn't have the correct permissions for public access.

## Solution: Configure Bucket Policies

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click on the **videos** bucket

### Step 2: Make Bucket Public

1. Click on the **videos** bucket
2. Click the **Settings** icon (gear icon)
3. Ensure **Public bucket** is enabled/checked
4. Click **Save**

### Step 3: Add Storage Policies

You need to add policies to allow public read access to the bucket.

1. In the Storage section, click on **Policies** tab
2. Click **New Policy**
3. Select **For full customization** or use the template

#### Policy 1: Public Read Access

**Policy Name:** `Public Access`

**Allowed operation:** `SELECT`

**Target roles:** `public` (or `anon`)

**Policy definition:**
```sql
bucket_id = 'videos'
```

OR use this SQL in the SQL Editor:

```sql
-- Allow public read access to videos bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

#### Policy 2: Public List Access (Optional but recommended)

```sql
-- Allow listing files in videos bucket
CREATE POLICY "Public List Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

### Step 4: Verify Bucket Configuration

After setting up policies, verify:

1. Bucket is marked as **Public**
2. Policy shows `public` or `anon` role has `SELECT` permission
3. Files are visible in the bucket

### Step 5: Test the Connection

Refresh your application and check:
- The diagnostic box should show "✅ Videos bucket found"
- Videos should load in the gallery

## Alternative: Use the Supabase Dashboard UI

### Quick Setup via Dashboard:

1. **Storage** → **videos** bucket
2. Click **Configuration** tab
3. Enable **Public bucket**
4. Under **Policies**, click **New policy**
5. Choose **Allow public read access** template
6. Click **Review** and **Save**

## Troubleshooting

### Still seeing "Videos bucket not found"?

**Check environment variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Verify bucket name:**
- Bucket must be named exactly `videos` (lowercase)
- Check for typos

**Check bucket exists:**
- Go to Storage in Supabase dashboard
- Verify `videos` bucket is listed

### Videos not loading?

**Check file extensions:**
- Files must end with `.mp4` or `.MP4` or `.mov`
- Verify files are uploaded correctly

**Check file permissions:**
- Files should be publicly accessible
- Test by opening the public URL directly

**Check CORS:**
- Supabase should handle CORS automatically
- If issues persist, check your Supabase project settings

## SQL Commands (Advanced)

If you prefer to set up policies via SQL:

```sql
-- Create the videos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public to read files
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Allow authenticated users to upload (optional)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to update (optional)
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos');

-- Allow authenticated users to delete (optional)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');
```

## Verification Checklist

- [ ] Bucket named `videos` exists
- [ ] Bucket is marked as **Public**
- [ ] Policy allows `public` or `anon` role to `SELECT`
- [ ] Files are uploaded to the bucket
- [ ] Files have `.mp4` or `.MP4` extension
- [ ] Environment variables are set correctly
- [ ] Application is restarted after env changes

## Next Steps

After configuring the bucket:

1. Refresh your application
2. Check the diagnostic box (bottom-right)
3. Should show: "✅ Found X files in videos bucket"
4. Videos should appear in the gallery
