"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, Heart } from "lucide-react";

interface Photo {
  src: string;
  alt: string;
  caption?: string;
  category?: string;
}

interface EnhancedPhotoGalleryProps {
  photos: Photo[];
  autoScroll?: boolean;
  scrollInterval?: number;
  showControls?: boolean;
  showThumbnails?: boolean;
  className?: string;
}

export default function EnhancedPhotoGallery({
  photos,
  autoScroll = true,
  scrollInterval = 4000,
  showControls = true,
  showThumbnails = true,
  className = "",
}: EnhancedPhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoScroll);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (isPlaying && autoScroll) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }, scrollInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, autoScroll, scrollInterval, photos.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleLike = (index: number) => {
    setLikedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    }
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  if (!photos.length) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div 
      ref={galleryRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(autoScroll)}
    >
      {/* Main Gallery */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'aspect-video md:aspect-[16/9]'} overflow-hidden rounded-xl`}>
        {/* Current Photo */}
        <div className="relative w-full h-full">
          <Image
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            fill
            className={`object-cover transition-all duration-700 ${
              isFullscreen ? 'object-contain' : 'object-cover'
            }`}
            priority={currentIndex === 0}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 md:opacity-100 transition-opacity duration-300" />
          
          {/* Photo Caption */}
          {currentPhoto.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full md:translate-y-0 transition-transform duration-300">
              <h3 className="text-xl font-semibold mb-1">{currentPhoto.caption}</h3>
              {currentPhoto.category && (
                <p className="text-sm text-white/80">{currentPhoto.category}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {showControls && (
          <>
            {/* Previous/Next Buttons */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Top Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Like Button */}
              <button
                onClick={() => toggleLike(currentIndex)}
                className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  likedPhotos.has(currentIndex)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                aria-label="Like photo"
              >
                <Heart className={`w-5 h-5 ${likedPhotos.has(currentIndex) ? 'fill-current' : ''}`} />
              </button>

              {/* Play/Pause Button */}
              {autoScroll && (
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                aria-label="Toggle fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Photo Counter */}
        <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-white text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Progress Indicator */}
        {autoScroll && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / photos.length) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && !isFullscreen && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                index === currentIndex 
                  ? 'ring-2 ring-orange-500 scale-110' 
                  : 'ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105'
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
              />
              {likedPhotos.has(index) && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-2 h-2 fill-current text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
          aria-label="Close fullscreen"
        >
          ×
        </button>
      )}
    </div>
  );
}
