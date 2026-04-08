"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoFileName?: string;
  videoUrl?: string; // Direct URL for local videos
  useSupabase?: boolean; // Whether to fetch from Supabase
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

export default function VideoPlayer({ 
  videoFileName,
  videoUrl: directVideoUrl,
  useSupabase = false,
  className = "",
  autoPlay = false,
  controls = true 
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(directVideoUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(!directVideoUrl);
  const [error, setError] = useState<string | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    // If direct URL is provided, use it
    if (directVideoUrl) {
      setVideoUrl(directVideoUrl);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch from Supabase if enabled
    async function fetchVideoUrl() {
      if (!videoFileName || !useSupabase) {
        setError("No video file specified");
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        if (!supabase) {
          setError("Supabase client not configured");
          setIsLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);

        if (data?.publicUrl) {
          setVideoUrl(data.publicUrl);
          setError(null);
        } else {
          setError("Failed to get video URL");
        }
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video");
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideoUrl();
  }, [videoFileName, directVideoUrl, useSupabase]);

  const togglePlay = () => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoElement) {
      videoElement.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoElement.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoElement.muted = false;
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen();
      }
    }
  };

  const handleVideoRef = (element: HTMLVideoElement | null) => {
    setVideoElement(element);
    if (element) {
      element.volume = volume;
    }
  };

  if (isLoading) {
    return (
      <div className={`relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center py-20 px-6">
          <p className="text-red-400 text-sm">{error || "Video not available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-2xl overflow-hidden group ${className}`}>
      <video
        ref={handleVideoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={isMuted}
        loop
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {controls && (
        <>
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            {!isPlaying && (
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-[var(--c-accent)] transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              {/* Volume Control */}
              <div 
                className="relative flex items-center gap-2"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 flex items-center justify-center text-white hover:text-[var(--c-accent)] transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : volume < 0.5 ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                
                {/* Volume Slider */}
                <div className={`transition-all duration-200 overflow-hidden ${
                  showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
                }`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer volume-slider"
                    style={{
                      background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`
                    }}
                  />
                </div>
                
                <style jsx>{`
                  .volume-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    transition: transform 0.2s;
                  }
                  .volume-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                  }
                  .volume-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: none;
                    transition: transform 0.2s;
                  }
                  .volume-slider::-moz-range-thumb:hover {
                    transform: scale(1.2);
                  }
                `}</style>
              </div>

              <div className="flex-1" />

              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-[var(--c-accent)] transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
