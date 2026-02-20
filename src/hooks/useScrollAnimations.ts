"use client";

import { useEffect, useState, useRef } from "react";

interface AnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animationClass?: string;
  delay?: number;
}

interface ScrollAnimationResult {
  ref: React.RefObject<HTMLElement | null>;
  isVisible: boolean;
  hasAnimated: boolean;
}

export function useScrollAnimation({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  animationClass = "animate-fade-up",
  delay = 0,
}: AnimationOptions = {}): ScrollAnimationResult {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasAnimated)) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, delay, hasAnimated]);

  return { ref, isVisible, hasAnimated };
}

interface StaggeredAnimationOptions extends AnimationOptions {
  staggerDelay?: number;
  itemCount?: number;
}

export function useStaggeredAnimation({
  staggerDelay = 100,
  itemCount = 1,
  ...animationOptions
}: StaggeredAnimationOptions = {}) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observers = refs.current.map((element, index) => {
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems((prev) => new Set(prev).add(index));
            }, index * staggerDelay);
          }
        },
        {
          threshold: animationOptions.threshold || 0.1,
          rootMargin: animationOptions.rootMargin || "0px",
        }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer) => {
        if (observer) observer.disconnect();
      });
    };
  }, [staggerDelay, animationOptions.threshold, animationOptions.rootMargin]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { refs: setRef, visibleItems };
}

interface ParallaxOptions {
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function useParallax({ speed = 0.5, direction = "up" }: ParallaxOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const rate = scrolled * -speed;

      let transform = "";
      switch (direction) {
        case "up":
          transform = `translateY(${rate}px)`;
          break;
        case "down":
          transform = `translateY(${-rate}px)`;
          break;
        case "left":
          transform = `translateX(${rate}px)`;
          break;
        case "right":
          transform = `translateX(${-rate}px)`;
          break;
      }

      ref.current.style.transform = transform;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return { ref, offset };
}

interface ScrollProgressResult {
  scrollY: number;
  scrollProgress: number;
  isScrollingUp: boolean;
  isScrollingDown: boolean;
}

export function useScrollProgress(): ScrollProgressResult {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const progress = currentScrollY / (documentHeight - windowHeight);

      setScrollY(currentScrollY);
      setScrollProgress(Math.min(progress, 1));
      setIsScrollingUp(currentScrollY < lastScrollY.current);
      setIsScrollingDown(currentScrollY > lastScrollY.current);
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isClient]);

  return { scrollY, scrollProgress, isScrollingUp, isScrollingDown };
}

// Utility function to get animation classes based on visibility
export function getAnimationClasses(
  isVisible: boolean,
  hasAnimated: boolean,
  animationClass: string = "animate-fade-up"
): string {
  if (!isVisible) return "opacity-0";
  if (hasAnimated) return animationClass;
  return "";
}

// Utility for staggered animations
export function getStaggeredClasses(
  index: number,
  visibleItems: Set<number>,
  animationClass: string = "animate-fade-up"
): string {
  if (!visibleItems.has(index)) return "opacity-0";
  return `${animationClass} animate-delay-${index * 100}`;
}
