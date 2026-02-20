"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationContextType {
  refreshScrollTrigger: () => void;
}

const ScrollAnimationContext = createContext<ScrollAnimationContextType>({
  refreshScrollTrigger: () => {},
});

export function useScrollAnimationContext() {
  return useContext(ScrollAnimationContext);
}

interface ScrollAnimationProviderProps {
  children: ReactNode;
}

export default function ScrollAnimationProvider({ children }: ScrollAnimationProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Configure GSAP defaults
    gsap.defaults({
      ease: "power3.out",
      duration: 1.2,
    });

    // Initialize scroll-triggered animations
    const initAnimations = () => {
      // Fade Up animations
      gsap.utils.toArray<HTMLElement>(".anim-fade-up").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "bottom 15%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Scale animations
      gsap.utils.toArray<HTMLElement>(".anim-scale").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Slide Left animations
      gsap.utils.toArray<HTMLElement>(".anim-slide-left").forEach((el) => {
        gsap.fromTo(
          el,
          { x: -80, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Slide Right animations
      gsap.utils.toArray<HTMLElement>(".anim-slide-right").forEach((el) => {
        gsap.fromTo(
          el,
          { x: 80, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Staggered children animations
      gsap.utils.toArray<HTMLElement>(".anim-stagger").forEach((container) => {
        const children = container.querySelectorAll(".anim-stagger-item");
        gsap.fromTo(
          children,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Image reveal animations
      gsap.utils.toArray<HTMLElement>(".img-reveal").forEach((el) => {
        const img = el.querySelector("img");
        const overlay = el.querySelector(".img-reveal-overlay");

        if (overlay) {
          gsap.fromTo(
            overlay,
            { scaleY: 1 },
            {
              scaleY: 0,
              duration: 1,
              ease: "power3.inOut",
              transformOrigin: "bottom",
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.3 },
            {
              scale: 1,
              duration: 1.4,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      });

      // Parallax effects
      gsap.utils.toArray<HTMLElement>(".parallax").forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-speed") || "0.5");
        gsap.to(el, {
          y: () => -100 * speed,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Float animations for decorative elements
      gsap.utils.toArray<HTMLElement>(".float-element").forEach((el, i) => {
        gsap.to(el, {
          y: "random(-20, 20)",
          rotation: "random(-5, 5)",
          duration: "random(3, 5)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2,
        });
      });
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initAnimations, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const refreshScrollTrigger = () => {
    ScrollTrigger.refresh();
  };

  return (
    <ScrollAnimationContext.Provider value={{ refreshScrollTrigger }}>
      {children}
    </ScrollAnimationContext.Provider>
  );
}
