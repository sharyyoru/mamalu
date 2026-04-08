# PowerShell script to compress videos for Supabase upload
# Requires ffmpeg to be installed: choco install ffmpeg

$sourceDir = Join-Path $PSScriptRoot "..\public\videos"
$outputDir = Join-Path $PSScriptRoot "..\public\videos\compressed"

# Create output directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Green
}

# Check if ffmpeg is installed
try {
    $ffmpegVersion = ffmpeg -version 2>&1
    Write-Host "ffmpeg is installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: ffmpeg is not installed!" -ForegroundColor Red
    Write-Host "Please install ffmpeg first:" -ForegroundColor Yellow
    Write-Host "  choco install ffmpeg" -ForegroundColor Yellow
    Write-Host "  OR download from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    exit 1
}

# Get all MP4 files
$videoFiles = Get-ChildItem -Path $sourceDir -Filter "*.MP4"

if ($videoFiles.Count -eq 0) {
    Write-Host "No MP4 files found in $sourceDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nFound $($videoFiles.Count) video file(s) to compress`n" -ForegroundColor Cyan

foreach ($file in $videoFiles) {
    $inputPath = $file.FullName
    $outputPath = Join-Path $outputDir $file.Name
    
    Write-Host "Compressing: $($file.Name)" -ForegroundColor Yellow
    Write-Host "  Input size: $([math]::Round($file.Length / 1MB, 2)) MB"
    
    # Compress video to target ~40MB (adjust bitrate as needed)
    # Using H.264 codec with AAC audio
    # Target bitrate: 500k for video
    $ffmpegArgs = @(
        "-i", $inputPath,
        "-vcodec", "h264",
        "-acodec", "aac",
        "-b:v", "500k",
        "-maxrate", "500k",
        "-bufsize", "1000k",
        "-preset", "medium",
        "-y",  # Overwrite output file
        $outputPath
    )
    
    try {
        & ffmpeg $ffmpegArgs 2>&1 | Out-Null
        
        if (Test-Path $outputPath) {
            $outputSize = (Get-Item $outputPath).Length
            Write-Host "  Output size: $([math]::Round($outputSize / 1MB, 2)) MB" -ForegroundColor Green
            Write-Host "  Saved to: $outputPath" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "  ERROR: Failed to create output file" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: Compression failed - $_" -ForegroundColor Red
    }
}

Write-Host "`nCompression complete!" -ForegroundColor Green
Write-Host "Compressed videos are in: $outputDir" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Review the compressed videos to ensure quality is acceptable"
Write-Host "2. Move compressed videos to public/videos/ (backup originals first)"
Write-Host "3. Run: node scripts/upload-videos-to-supabase.js"
