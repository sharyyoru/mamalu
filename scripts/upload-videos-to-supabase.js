const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BUCKET_NAME = 'videos';
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');

async function createBucketIfNotExists() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return false;
  }

  const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
    console.log('Bucket created successfully');
  } else {
    console.log(`Bucket ${BUCKET_NAME} already exists`);
  }

  return true;
}

async function uploadVideo(filePath, fileName) {
  console.log(`Uploading ${fileName}...`);
  
  const fileBuffer = fs.readFileSync(filePath);
  const fileExt = path.extname(fileName).toLowerCase();
  
  const contentType = fileExt === '.mp4' ? 'video/mp4' : 'video/quicktime';

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Error uploading ${fileName}:`, error);
    return false;
  }

  console.log(`✓ Successfully uploaded ${fileName}`);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);
  
  console.log(`  Public URL: ${urlData.publicUrl}`);
  return true;
}

async function uploadAllVideos() {
  console.log('Starting video upload to Supabase...\n');

  // Create bucket if it doesn't exist
  const bucketReady = await createBucketIfNotExists();
  if (!bucketReady) {
    console.error('Failed to create or access bucket');
    return;
  }

  // Check if videos directory exists
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Videos directory not found: ${VIDEOS_DIR}`);
    return;
  }

  // Get all video files
  const files = fs.readdirSync(VIDEOS_DIR);
  const videoFiles = files.filter(file => 
    file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.mov')
  );

  if (videoFiles.length === 0) {
    console.log('No video files found in the videos directory');
    return;
  }

  console.log(`Found ${videoFiles.length} video file(s)\n`);

  // Upload each video
  let successCount = 0;
  for (const file of videoFiles) {
    const filePath = path.join(VIDEOS_DIR, file);
    const success = await uploadVideo(filePath, file);
    if (success) successCount++;
  }

  console.log(`\n✓ Upload complete: ${successCount}/${videoFiles.length} videos uploaded successfully`);
}

uploadAllVideos().catch(console.error);
