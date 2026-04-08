"use client";

import { useState } from "react";
import VideoPlayer from "./VideoPlayer";

const localVideos = [
  {
    id: "1",
    name: "Video 1",
    url: "/videos/4FA54BC7-72B7-44CF-810C-60162709EB1E.MP4",
  },
  {
    id: "2",
    name: "Video 2",
    url: "/videos/AD05CB74-6913-4BD4-B254-4BC41560E4D5.MP4",
  },
  {
    id: "3",
    name: "Video 3",
    url: "/videos/C9154A1A-C132-4B64-BE79-1F5809AF593C.MP4",
  },
  {
    id: "4",
    name: "Video 4",
    url: "/videos/EA36495D-8DFD-40FF-AA19-7D2245F9F1EE.MP4",
  },
];

interface LocalVideoGalleryProps {
  className?: string;
}

export default function LocalVideoGallery({ className = "" }: LocalVideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState(localVideos[0]);

  return (
    <div className={className}>
      {/* Main Video Player */}
      <div className="mb-6">
        <VideoPlayer 
          videoUrl={selectedVideo.url}
          className="w-full h-96 md:h-[500px]"
          controls={true}
          key={selectedVideo.id} // Force re-render when video changes
        />
      </div>

      {/* Video Thumbnails */}
      {localVideos.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {localVideos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                selectedVideo.id === video.id
                  ? "border-[var(--c-accent)] ring-2 ring-[var(--c-accent)]/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <span className="text-white text-sm font-medium">{video.name}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
