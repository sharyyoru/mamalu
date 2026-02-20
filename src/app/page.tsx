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
    <main className="overflow-hidden">
      {/* Hero Section - Peach background like mybird.com */}
      <section
        ref={heroRef}
        className="relative pt-36 pb-16 overflow-hidden"
      >
        {/* White background base */}
        <div className="absolute inset-0 bg-white" />
        
        {/* Wavy TOP border - white to peach transition like mybird */}
        <div className="absolute top-0 left-0 right-0 h-24 z-0">
          <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none">
            <path 
              d="M0,0 L1440,0 L1440,60 C1300,80 1100,30 900,50 C700,70 500,30 300,50 C150,65 50,40 0,55 Z" 
              fill="var(--c-peach)"
            />
          </svg>
        </div>
        
        {/* Peach background section */}
        <div className="absolute top-20 bottom-20 left-0 right-0 bg-[var(--c-peach)] z-0" />
        
        {/* Wavy BOTTOM border - peach to white transition */}
        <div className="absolute bottom-0 left-0 right-0 h-24 z-0">
          <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none">
            <path 
              d="M0,40 C150,20 300,60 500,35 C700,10 900,50 1100,30 C1300,10 1400,40 1440,25 L1440,100 L0,100 Z" 
              fill="white"
            />
          </svg>
        </div>

        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left: Text Content */}
            <div ref={heroTextRef} className="relative z-10">
              {/* Main Title - Large like mamalukitchen */}
              <h1 className="hero-title mb-6">
                <span className="hero-title-line block text-[clamp(3rem,10vw,7rem)] leading-[1] font-bold">
                  Cooking
                </span>
                <span className="hero-title-line block text-[clamp(3rem,10vw,7rem)] leading-[1] font-bold text-gradient">
                  Classes
                </span>
                <span className="hero-title-line block text-[clamp(3rem,10vw,7rem)] leading-[1] font-bold">
                  For All
                </span>
              </h1>

              {/* Subtitle - positioned like mybird */}
              <p className="hero-subtitle text-lg md:text-xl text-[var(--c-gray)] max-w-md mb-10 leading-relaxed">
                Fun and healthy cooking classes in Dubai for kids, families, and teams. Create delicious memories.
              </p>

              {/* CTAs - pill buttons like mybird */}
              <div className="hero-cta flex flex-wrap gap-4 items-center">
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-[var(--c-black)] text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:bg-[var(--c-black)] hover:text-white"
                >
                  Book a Class
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-[var(--c-black)] text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:bg-[var(--c-black)] hover:text-white"
                >
                  Shop Now
                </Link>
                <div className="w-10 h-10 rounded-full bg-[var(--c-accent)] flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-[var(--c-accent-dark)]" />
                </div>
              </div>
            </div>

            {/* Right: Cooking Animation GIF */}
            <div className="relative flex items-center justify-center z-10">
              <Image 
                src="/graphics/final-cooking.gif"
                alt="Cooking Animation"
                width={450}
                height={450}
                className="w-full max-w-md lg:max-w-lg"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* Stats Section - visible in one screen, doubled icon sizes */}
          <div className="hero-stats grid grid-cols-3 gap-4 md:gap-8 mt-10 pt-8 border-t border-[var(--c-black)]/10 relative z-10">
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3">
                <Image 
                  src="/graphics/happy-kids.gif"
                  alt="Happy Kids"
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[var(--c-black)] text-base md:text-lg">Happy Kids</div>
              <div className="text-sm md:text-base text-[var(--c-gray)]">2000+</div>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3">
                <Image 
                  src="/graphics/classes.gif"
                  alt="Classes Held"
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[var(--c-black)] text-base md:text-lg">Classes Held</div>
              <div className="text-sm md:text-base text-[var(--c-gray)]">500+</div>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3">
                <Image 
                  src="/graphics/reviews.gif"
                  alt="Star Rating"
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[var(--c-black)] text-base md:text-lg">Star Rating</div>
              <div className="text-sm md:text-base text-[var(--c-gray)]">4.9</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section py-24 md:py-32 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title text-4xl md:text-6xl mb-4">
              Choose Your <span className="text-gradient">Adventure</span>
            </h2>
            <p className="section-title text-lg text-[var(--c-gray)] max-w-xl mx-auto">
              From little bakers to master chefs, we have the perfect class for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <Link
                key={service.id}
                href={service.href}
                className="service-card card group cursor-pointer"
              >
                <div className="card-image aspect-[4/5] relative">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Icon */}
                  <div
                    className="absolute top-4 right-4 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{ backgroundColor: service.color }}
                  >
                    <service.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2 group-hover:translate-x-2 transition-transform duration-500">
                      {service.title}
                    </h3>
                    <p className="text-white/80 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2 mt-4 font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section section py-20 bg-[var(--c-black)]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-bold text-[var(--c-accent-dark)] mb-2">
                  {stat.value}
                </div>
                <div className="text-white/70">{stat.label}</div>
              </div>
            ))}
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

      {/* CTA Section */}
      <section className="section py-24 md:py-32 bg-[var(--c-black)] text-white text-center">
        <div className="container">
          <h2 className="section-title text-4xl md:text-6xl mb-6">
            Ready to Start Cooking?
          </h2>
          <p className="section-title text-xl opacity-90 max-w-xl mx-auto mb-10">
            Join thousands of happy families who have discovered the joy of cooking together
          </p>
          <Link
            href="/classes"
            className="section-title inline-flex items-center gap-3 bg-white text-[var(--c-black)] px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Your First Class</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
