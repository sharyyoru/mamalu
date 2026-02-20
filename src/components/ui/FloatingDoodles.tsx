"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Doodle {
  id: string;
  src: string;
  alt: string;
  animation: string;
  delay: number;
  size: number;
  position: { x: number; y: number };
  interactive?: boolean;
  speed?: number;
}

interface FloatingDoodlesProps {
  className?: string;
  density?: "low" | "medium" | "high";
  interactive?: boolean;
  theme?: "cooking" | "celebration" | "mixed";
  enableParallax?: boolean;
}

const cookingDoodles = [
  "/images/apron.png",
  "/images/whisk-01.png", 
  "/images/rolling pin-01.png",
  "/images/pasta-01.png",
  "/images/pot-01.png",
  "/images/salt-01.png",
  "/images/turkey-01.png",
  "/images/recipe-01.png",
  "/images/noodles-01.png",
  "/images/broccoli-01.png",
  "/images/kale-01.png",
  "/images/potato-01.png",
  "/images/pizza cutter-01.png",
  "/images/skewers-01.png",
  "/images/spoon big-01.png",
  "/images/knives-01.png",
  "/images/gloves-01.png",
  "/images/flames.png",
  "/images/grill.png",
  "/images/pot big-01.png",
];

const celebrationDoodles = [
  "/images/turkey-02.png",
  "/images/girl-01.png",
  "/images/arrow-01.png",
  "/images/arrow 2-01.png",
  "/images/speech-bubble.png",
  "/images/notepad.png",
  "/images/lunch-bag.png",
  "/images/movieclapper.png",
  "/images/center.png",
];

const animationClasses = [
  "animate-doodle-float",
  "animate-doodle-bounce", 
  "animate-doodle-rotate",
  "animate-doodle-wiggle",
  "animate-doodle-scale",
  "animate-doodle-pulse",
  "animate-doodle-sway",
];

const densityMap = {
  low: 5,
  medium: 8,
  high: 12,
};

export default function FloatingDoodles({ 
  className = "", 
  density = "medium",
  interactive = false,
  theme = "mixed",
  enableParallax = false
}: FloatingDoodlesProps) {
  const [doodles, setDoodles] = useState<Doodle[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const count = densityMap[density];
    const newDoodles: Doodle[] = [];
    
    let doodlePool = cookingDoodles;
    if (theme === "celebration") {
      doodlePool = celebrationDoodles;
    } else if (theme === "mixed") {
      doodlePool = [...cookingDoodles, ...celebrationDoodles];
    }
    
    for (let i = 0; i < count; i++) {
      const imageIndex = Math.floor(Math.random() * doodlePool.length);
      const animationIndex = Math.floor(Math.random() * animationClasses.length);
      
      newDoodles.push({
        id: `doodle-${i}-${Date.now()}`,
        src: doodlePool[imageIndex],
        alt: `Cooking decoration ${i + 1}`,
        animation: animationClasses[animationIndex],
        delay: Math.random() * 3,
        size: 30 + Math.random() * 50, // 30-80px
        position: {
          x: Math.random() * 85 + 5, // 5-90% to avoid edges
          y: Math.random() * 85 + 5,
        },
        interactive: interactive && Math.random() > 0.6, // 40% chance of being interactive
        speed: 0.5 + Math.random() * 1.5, // Variable animation speeds
      });
    }
    
    setDoodles(newDoodles);
  }, [density, interactive, theme]);

  // Mouse tracking for parallax effect
  useEffect(() => {
    if (!enableParallax) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableParallax]);

  const handleDoodleClick = (doodle: Doodle) => {
    if (!doodle.interactive) return;
    
    // Add a fun interaction - make it spin and grow temporarily
    const element = document.getElementById(doodle.id);
    if (element) {
      element.style.animation = 'none';
      setTimeout(() => {
        element.style.animation = `doodle-spin-slow 0.5s ease-out, doodle-scale 0.5s ease-out`;
      }, 10);
      setTimeout(() => {
        element.style.animation = `${doodle.animation} ${doodle.speed}s ease-in-out infinite`;
      }, 510);
    }
  };

  if (!mounted) return null;

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {doodles.map((doodle) => {
        const parallaxOffset = enableParallax ? {
          x: (mousePosition.x - 0.5) * 20 * (1 - doodle.position.y / 100),
          y: (mousePosition.y - 0.5) * 20 * (1 - doodle.position.x / 100),
        } : { x: 0, y: 0 };

        return (
          <div
            key={doodle.id}
            id={doodle.id}
            className={`hero-doodle ${doodle.animation} ${
              doodle.interactive ? "pointer-events-auto doodle-interactive cursor-pointer" : ""
            }`}
            style={{
              left: `${doodle.position.x}%`,
              top: `${doodle.position.y}%`,
              width: `${doodle.size}px`,
              height: `${doodle.size}px`,
              animationDelay: `${doodle.delay}s`,
              animationDuration: `${doodle.speed}s`,
              opacity: doodle.interactive ? 0.6 : 0.15,
              transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
              transition: 'transform 0.3s ease-out',
            }}
            onClick={() => handleDoodleClick(doodle)}
          >
            <Image
              src={doodle.src}
              alt={doodle.alt}
              width={doodle.size}
              height={doodle.size}
              className="w-full h-full object-contain"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
