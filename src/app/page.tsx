"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Calendar, ArrowRight, Star, Heart, ChefHat, Users, Cake, Baby } from "lucide-react";
import ShapeSlideshow from "@/components/ui/ShapeSlideshow";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const heroImages = [
  "/images/Mamalou Kitchen - 103_edited.jpg",
  "/images/IMG_3079_edited.jpg",
  "/images/kids-classes.png",
  "/images/birthday-parties.png",
  "/images/Mamalou Kitchen - 151.jpg",
  "/images/family-classes.png",
];

const services = [
  {
    id: "birthday",
    title: "Birthday Parties",
    description: "Fun cooking birthday parties for kids with delicious recipes",
    icon: Cake,
    image: "/images/birthday-parties.png",
    color: "#ff8c6b",
    href: "/book/birthday-deck",
  },
  {
    id: "corporate",
    title: "Corporate Events",
    description: "Team building culinary experiences for companies",
    icon: Users,
    image: "/images/adult-classes.png",
    color: "#6366f1",
    href: "/book/corporate-deck",
  },
  {
    id: "nanny",
    title: "Nanny Classes",
    description: "Professional cooking training for caregivers",
    icon: ChefHat,
    image: "/images/family-classes.png",
    color: "#10b981",
    href: "/book/nanny-class",
  },
  {
    id: "kids",
    title: "Kids Classes",
    description: "Fun and educational cooking for little chefs",
    icon: Baby,
    image: "/images/kids-classes.png",
    color: "#f59e0b",
    href: "/classes",
  },
];

const stats = [
  { value: "2000+", label: "Happy Kids" },
  { value: "500+", label: "Classes Held" },
  { value: "4.9", label: "Star Rating" },
  { value: "5+", label: "Years Experience" },
];

const galleryImages = [
  "/images/Mamalou Kitchen - 103_edited.jpg",
  "/images/IMG_3079_edited.jpg",
  "/images/File_000-2.jpeg",
  "/images/Mamalou Kitchen - 151.jpg",
  "/images/IMG_4199.jpg",
  "/images/File_010.jpeg",
];

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation timeline
      const heroTl = gsap.timeline();
      
      heroTl
        .fromTo(
          ".hero-title-line",
          { y: 120, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out" }
        )
        .fromTo(
          ".hero-subtitle",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
          "-=0.6"
        )
        .fromTo(
          ".hero-cta",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
          "-=0.4"
        )
        .fromTo(
          ".hero-stats",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.4"
        )
        .fromTo(
          ".hero-doodle",
          { scale: 0, rotation: -20, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 0.15, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" },
          "-=0.8"
        );

      // Floating doodles animation
      gsap.utils.toArray<HTMLElement>(".hero-doodle").forEach((el, i) => {
        gsap.to(el, {
          y: "random(-25, 25)",
          rotation: "random(-8, 8)",
          duration: "random(4, 6)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });

      // Services section animation
      ScrollTrigger.batch(".service-card", {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out" }
          );
        },
        start: "top 85%",
      });

      // Stats animation
      ScrollTrigger.create({
        trigger: ".stats-section",
        start: "top 80%",
        onEnter: () => {
          gsap.fromTo(
            ".stat-item",
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
          );
        },
      });

      // Gallery parallax
      gsap.utils.toArray<HTMLElement>(".gallery-item").forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -50 : 50,
          ease: "none",
          scrollTrigger: {
            trigger: ".gallery-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      // Section titles animation
      gsap.utils.toArray<HTMLElement>(".section-title").forEach((el) => {
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
            },
          }
        );
      });

      // Founder section animation
      ScrollTrigger.create({
        trigger: ".founder-section",
        start: "top 70%",
        onEnter: () => {
          gsap.fromTo(
            ".founder-image",
            { x: -100, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
          );
          gsap.fromTo(
            ".founder-content",
            { x: 100, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.2 }
          );
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="overflow-hidden -mt-32 lg:-mt-36">
      {/* Hero Section - Peach background with wave borders */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-12 bg-[var(--c-peach)] overflow-hidden"
      >
        {/* Wavy TOP border - creates wave effect at top */}
        <div className="absolute -top-1 left-0 right-0 h-16 z-10">
          <svg viewBox="0 0 1440 60" className="w-full h-full" preserveAspectRatio="none">
            <path 
              d="M0,60 L0,20 C200,40 400,5 600,25 C800,45 1000,10 1200,30 C1350,45 1420,25 1440,35 L1440,60 Z" 
              fill="var(--c-peach)"
            />
            <path 
              d="M0,0 L1440,0 L1440,20 C1300,35 1100,10 900,25 C700,40 500,15 300,30 C150,40 50,20 0,30 Z" 
              fill="white"
            />
          </svg>
        </div>
        
        {/* Wavy BOTTOM border - peach to white transition */}
        <div className="absolute -bottom-1 left-0 right-0 h-16 z-10">
          <svg viewBox="0 0 1440 60" className="w-full h-full" preserveAspectRatio="none">
            <path 
              d="M0,0 C200,20 400,0 600,15 C800,30 1000,5 1200,20 C1350,30 1420,15 1440,25 L1440,60 L0,60 Z" 
              fill="white"
            />
          </svg>
        </div>

        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left: Text Content - centered on mobile/tablet */}
            <div ref={heroTextRef} className="relative z-10 text-center lg:text-left">
              {/* Main Title - 2 lines */}
              <h1 className="hero-title mb-4">
                <span className="hero-title-line block text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.1] font-bold">
                  Cooking Classes
                </span>
                <span className="hero-title-line block text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.1] font-bold text-gradient">
                  For Everyone
                </span>
              </h1>

              {/* Subtitle */}
              <p className="hero-subtitle text-base md:text-lg text-[var(--c-gray)] max-w-md mx-auto lg:mx-0 mb-6 leading-relaxed">
                Fun and healthy cooking classes in Dubai for kids, families, and teams. Create delicious memories.
              </p>

              {/* CTAs - animated Book a Class button, centered on mobile */}
              <div className="hero-cta flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                <Link
                  href="/classes"
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--c-black)] text-white text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10">Book a Class</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[var(--c-peach-dark)] to-[var(--c-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute -inset-1 bg-[var(--c-black)] rounded-full animate-pulse opacity-20" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--c-black)] text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:bg-[var(--c-black)] hover:text-white"
                >
                  Shop Now
                </Link>
              </div>
            </div>

            {/* Right: Cooking Animation GIF - larger for balance */}
            <div className="relative flex items-center justify-center z-10">
              <Image 
                src="/graphics/final-cooking.gif"
                alt="Cooking Animation"
                width={500}
                height={500}
                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                unoptimized
                priority
              />
            </div>
          </div>

        </div>
      </section>

      {/* Stats Section - moved higher, 1.5x bigger icons/text */}
      <section className="-mt-8 py-8 bg-white relative z-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="hero-stats grid grid-cols-3 gap-8 md:gap-16">
            <div className="text-center">
              <div className="w-40 h-40 md:w-52 md:h-52 mx-auto mb-3">
                <Image 
                  src="/graphics/happy-kids.gif"
                  alt="Happy Kids"
                  width={208}
                  height={208}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[var(--c-black)] text-xl md:text-3xl" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>Happy Kids</div>
              <div className="text-lg md:text-2xl text-[var(--c-gray)]" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>2000+</div>
            </div>
            <div className="text-center">
              <div className="w-40 h-40 md:w-52 md:h-52 mx-auto mb-3">
                <Image 
                  src="/graphics/classes.gif"
                  alt="Classes Held"
                  width={208}
                  height={208}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[var(--c-black)] text-xl md:text-3xl" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>Classes Held</div>
              <div className="text-lg md:text-2xl text-[var(--c-gray)]" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>500+</div>
            </div>
            <div className="text-center">
              <div className="w-40 h-40 md:w-52 md:h-52 mx-auto mb-3">
                <Image 
                  src="/graphics/reviews.gif"
                  alt="Star Rating"
                  width={208}
                  height={208}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[var(--c-black)] text-xl md:text-3xl" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>Star Rating</div>
              <div className="text-lg md:text-2xl text-[var(--c-gray)]" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>4.9</div>
            </div>
          </div>
        </div>
      </section>


      {/* Gallery Section */}
      <section className="gallery-section section py-24 md:py-32 overflow-hidden">
        <div className="container">
          <h2 className="section-title text-4xl md:text-6xl text-center mb-16">
            Life at <span className="text-gradient">Mamalu</span>
          </h2>
          
          <div className="flex gap-4 overflow-hidden">
            {galleryImages.map((src, i) => (
              <div
                key={i}
                className="gallery-item flex-shrink-0 w-64 md:w-80 aspect-[4/5] rounded-2xl overflow-hidden"
              >
                <Image
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  width={320}
                  height={400}
                  quality={100}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="founder-section section py-24 md:py-32 bg-[var(--c-warm)]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="founder-image relative">
              <div className="aspect-[3/4] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/founder-lama.jpg"
                  alt="Lama - Founder of Mamalu Kitchen"
                  fill
                  quality={100}
                  className="object-cover object-top"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
                <Heart className="w-8 h-8 text-[var(--c-accent-dark)] fill-[var(--c-accent-dark)]" />
                <div>
                  <div className="font-bold text-[var(--c-black)]">5+ Years</div>
                  <div className="text-sm text-[var(--c-gray)]">Feeding Families</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="founder-content">
              <h2 className="text-4xl md:text-5xl mb-6">
                Meet <span className="text-gradient">Lama</span>
              </h2>
              <p className="text-lg text-[var(--c-gray)] mb-6 leading-relaxed">
                Mamalu Kitchen was inspired by her 3 boys and the need to help fellow mums and families simplify their day-to-day lives without having to worry about feeding their family fuss-free healthy food.
              </p>
              <p className="text-lg text-[var(--c-gray)] mb-8 leading-relaxed">
                Mamalu Kitchen is creating a cooking movement under the slogan <span className="text-[var(--c-black)] font-semibold">#feedingfamilies</span>.
              </p>
              <Link href="/our-story" className="btn-primary group">
                <span>Our Story</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
