"use client";

import { ReactNode, ElementType } from "react";
import { useScrollAnimation, getAnimationClasses } from "@/hooks/useScrollAnimations";

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale-in" | "slide-left" | "slide-right";
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
  as?: ElementType;
}

const animationMap = {
  "fade-up": "animate-fade-up",
  "fade-left": "animate-slide-left", 
  "fade-right": "animate-slide-right",
  "scale-in": "animate-scale-in",
  "slide-left": "animate-slide-left",
  "slide-right": "animate-slide-right",
};

export default function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  className = "",
  as: Component = "section",
}: AnimatedSectionProps) {
  const { ref, isVisible, hasAnimated } = useScrollAnimation({
    threshold,
    triggerOnce,
    delay,
    animationClass: animationMap[animation],
  });

  const animationClasses = getAnimationClasses(
    isVisible,
    hasAnimated,
    animationMap[animation]
  );

  return (
    <Component
      ref={ref}
      className={`${animationClasses} ${className}`}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </Component>
  );
}
