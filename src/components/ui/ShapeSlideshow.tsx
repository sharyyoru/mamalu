"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

interface ShapeSlideshowProps {
  images: string[];
  interval?: number;
  className?: string;
}

export default function ShapeSlideshow({ 
  images, 
  interval = 4000,
  className = "" 
}: ShapeSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current || images.length === 0) return;

    // Initial animation
    gsap.set(imageRefs.current[0], { opacity: 1, scale: 1 });
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % images.length;
        
        // Animate out current image
        gsap.to(imageRefs.current[prev], {
          opacity: 0,
          scale: 0.9,
          duration: 1,
          ease: "power2.inOut",
        });
        
        // Animate in next image
        gsap.fromTo(
          imageRefs.current[nextIndex],
          { opacity: 0, scale: 1.1 },
          { opacity: 1, scale: 1, duration: 1, ease: "power2.inOut" }
        );
        
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Main circular shape */}
      <div className="relative w-full aspect-square">
        {/* Organic blob shape mask */}
        <div className="absolute inset-0 overflow-hidden" style={{
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}>
          {images.map((src, index) => (
            <div
              key={src}
              ref={(el) => { imageRefs.current[index] = el; }}
              className="absolute inset-0"
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              <Image
                src={src}
                alt={`Slideshow image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        
        {/* Soft gradient overlay for faded effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, transparent 30%, var(--c-cream) 100%)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          }}
        />
      </div>

      {/* Secondary floating shapes */}
      <div 
        className="absolute -top-8 -right-8 w-32 h-32 overflow-hidden opacity-60"
        style={{
          borderRadius: "70% 30% 50% 50% / 30% 50% 50% 70%",
        }}
      >
        <Image
          src={images[(currentIndex + 1) % images.length]}
          alt=""
          fill
          className="object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, transparent 20%, var(--c-cream) 80%)",
          }}
        />
      </div>

      <div 
        className="absolute -bottom-12 -left-12 w-40 h-40 overflow-hidden opacity-50"
        style={{
          borderRadius: "40% 60% 70% 30% / 60% 40% 60% 40%",
        }}
      >
        <Image
          src={images[(currentIndex + 2) % images.length]}
          alt=""
          fill
          className="object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, transparent 20%, var(--c-cream) 80%)",
          }}
        />
      </div>

      {/* Small decorative shape */}
      <div 
        className="absolute top-1/4 -left-16 w-20 h-20 overflow-hidden opacity-40"
        style={{
          borderRadius: "50% 50% 50% 50%",
        }}
      >
        <Image
          src={images[(currentIndex + 3) % images.length]}
          alt=""
          fill
          className="object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, transparent 10%, var(--c-cream) 70%)",
          }}
        />
      </div>
    </div>
  );
}
