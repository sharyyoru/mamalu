# Video Player Setup Guide

## Overview

This project includes video player components that can work with both local videos (from the public folder) and Supabase Storage.

## Components

### 1. VideoPlayer
A customizable video player with controls.

**Props:**
- `videoUrl` - Direct URL to video file (for local videos)
- `videoFileName` - Filename in Supabase storage
- `useSupabase` - Whether to fetch from Supabase (default: false)
- `className` - CSS classes
- `autoPlay` - Auto-play video (default: false)
- `controls` - Show player controls (default: true)

**Usage with local videos:**
```tsx
<VideoPlayer 
  videoUrl="/videos/my-video.mp4"
  controls={true}
/>
```

**Usage with Supabase:**
```tsx
<VideoPlayer 
  videoFileName="my-video.mp4"
  useSupabase={true}
  controls={true}
/>
```

### 2. LocalVideoGallery
A gallery component that displays multiple local videos with thumbnail navigation.

**Usage:**
```tsx
import LocalVideoGallery from "@/components/LocalVideoGallery";

<LocalVideoGallery className="my-8" />
```

### 3. VideoGallery
A gallery component that fetches and displays videos from Supabase Storage.

**Usage:**
```tsx
import VideoGallery from "@/components/VideoGallery";

<VideoGallery 
  bucketName="videos"
  maxVideos={4}
  className="my-8"
/>
```

## Current Setup

Currently, videos are stored in the `public/videos` folder and served locally. This is because:
- The video files are ~95MB each
- Supabase free tier has a 50MB file size limit
- Videos need to be compressed or you need to upgrade to Supabase Pro

## Uploading to Supabase

### Prerequisites
1. Supabase Pro account (for files >50MB) OR compressed videos (<50MB each)
2. Environment variables configured in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Steps to Upload

1. **Compress videos (if needed):**
   ```bash
   # Using ffmpeg to compress videos
   ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 1000k output.mp4
   ```

2. **Run the upload script:**
   ```bash
   node scripts/upload-videos-to-supabase.js
   ```

3. **Update components to use Supabase:**
   Replace `LocalVideoGallery` with `VideoGallery` in your pages.

### Manual Upload via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a bucket named "videos" (set to public)
4. Upload your video files
5. Use the `VideoGallery` or `VideoPlayer` components with `useSupabase={true}`

## Video Compression Guide

To compress videos while maintaining quality:

```bash
# Install ffmpeg (if not already installed)
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg

# Compress video to ~30MB (adjust bitrate as needed)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 500k -maxrate 500k -bufsize 1000k output.mp4

# Batch compress all videos in a folder
for file in public/videos/*.MP4; do
  ffmpeg -i "$file" -vcodec h264 -acodec aac -b:v 500k -maxrate 500k -bufsize 1000k "public/videos/compressed_$(basename "$file")"
done
```

## Troubleshooting

### Videos not loading
- Check that video files exist in `public/videos/`
- Verify file paths are correct
- Check browser console for errors

### Supabase upload fails
- Verify environment variables are set
- Check file size limits
- Ensure bucket permissions are set to public
- Verify service role key has storage permissions

### Video playback issues
- Ensure videos are in MP4 format (H.264 codec)
- Check browser compatibility
- Verify CORS settings if using external storage

## Performance Tips

1. **Lazy loading:** Videos are loaded only when needed
2. **Compression:** Keep video files under 50MB for better performance
3. **CDN:** Consider using a CDN for video delivery in production
4. **Adaptive streaming:** For larger videos, consider HLS or DASH streaming

## Future Enhancements

- [ ] Add video thumbnails/posters
- [ ] Implement adaptive bitrate streaming
- [ ] Add video progress tracking
- [ ] Support for subtitles/captions
- [ ] Video analytics integration
