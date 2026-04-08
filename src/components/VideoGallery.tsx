"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "./VideoPlayer";
import { Loader2 } from "lucide-react";

interface VideoGalleryProps {
  className?: string;
  bucketName?: string;
  maxVideos?: number;
}

export default function VideoGallery({ 
  className = "",
  bucketName = "videos",
  maxVideos = 4
}: VideoGalleryProps) {
  const [videos, setVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const supabase = createClient();
        
        if (!supabase) {
          setError("Supabase client not configured");
          setIsLoading(false);
          return;
        }

        const { data, error: listError } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (listError) {
          setError(`Failed to load videos: ${listError.message}`);
        } else if (data) {
          const videoFiles = data
            .filter(file => {
              const fileName = file.name.toLowerCase();
              const isVideo = fileName.endsWith('.mp4') || fileName.endsWith('.mov');
              return isVideo && file.name !== '.emptyFolderPlaceholder';
            })
            .map(file => file.name);
          
          setVideos(videoFiles);
          if (videoFiles.length > 0) {
            setSelectedVideo(videoFiles[0]);
          } else {
            setError("No video files found in bucket");
          }
        }
      } catch (err) {
        setError(`Failed to load videos`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideos();
  }, [bucketName, maxVideos]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
          <p className="text-gray-600 text-sm">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className={`text-center py-20 ${className}`}>
        <p className="text-gray-500">{error || "No videos available"}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main Video Player */}
      <div className="mb-6">
        <VideoPlayer 
          videoFileName={selectedVideo || undefined}
          useSupabase={true}
          className="w-full h-96 md:h-[500px]"
          controls={true}
          key={selectedVideo} // Force re-render when video changes
        />
      </div>

      {/* Video Thumbnails */}
      {videos.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videos.map((video, index) => {
            const supabase = createClient();
            const videoUrl = supabase?.storage.from(bucketName).getPublicUrl(video).data.publicUrl;
            
            return (
              <button
                key={video}
                onClick={() => setSelectedVideo(video)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                  selectedVideo === video
                    ? "border-[var(--c-accent)] ring-2 ring-[var(--c-accent)]/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Video Thumbnail */}
                {videoUrl && (
                  <video
                    src={`${videoUrl}#t=0.5`}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
