"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoPlayer({ isOpen, onClose }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsLoaded(true);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Video Panel - Slides from left */}
      <div
        ref={containerRef}
        className={`fixed top-0 left-0 h-full w-full md:w-[500px] lg:w-[550px] bg-white z-[101] shadow-2xl transform transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-all hover:scale-110"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-xl font-bold text-stone-900">Our Story</h3>
          <p className="text-sm text-stone-500 mt-1">Watch how Mamalu Kitchen began</p>
        </div>

        {/* Instagram Embed Container */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoaded && (
            <div className="relative w-full" style={{ minHeight: "600px" }}>
              {/* Instagram Embed */}
              <iframe
                src="https://www.instagram.com/p/DRCZwxAieXW/embed/"
                className="w-full border-0 rounded-xl overflow-hidden"
                style={{ height: "700px", maxHeight: "calc(100vh - 150px)" }}
                allowFullScreen
                allow="autoplay; encrypted-media"
                title="Mamalu Kitchen Story"
              />
            </div>
          )}
        </div>

        {/* Footer with CTA */}
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <a
            href="https://www.instagram.com/mamalukitchen/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Follow @mamalukitchen
          </a>
        </div>
      </div>
    </>
  );
}
