"use client";

import { useEffect, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollAnimations";
import { ChevronUp } from "lucide-react";

interface ScrollProgressProps {
  showScrollIndicator?: boolean;
  scrollThreshold?: number;
  className?: string;
}

export default function ScrollProgress({
  showScrollIndicator = true,
  scrollThreshold = 0.2,
  className = "",
}: ScrollProgressProps) {
  const { scrollProgress, scrollY, isScrollingUp, isScrollingDown } = useScrollProgress();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shouldShowScrollIndicator = isClient && scrollY > (window.innerHeight * scrollThreshold);

  return (
    <>
      {/* Progress Bar */}
      <div 
        className={`fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 z-50 transition-all duration-300 ${className}`}
        style={{
          width: `${scrollProgress * 100}%`,
          opacity: scrollProgress > 0.01 ? 1 : 0,
        }}
      />

      {/* Scroll to Top Button */}
      {showScrollIndicator && shouldShowScrollIndicator && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center group ${
            isScrollingUp ? "scale-110" : "scale-100"
          } ${
            isScrollingDown ? "animate-bounce" : ""
          }`}
          aria-label="Scroll to top"
        >
          <ChevronUp 
            className={`w-6 h-6 transition-transform duration-300 ${
              isScrollingUp ? "translate-y-0" : "translate-y-1"
            } group-hover:translate-y-0`}
          />
        </button>
      )}
    </>
  );
}
