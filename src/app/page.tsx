"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Heart } from "lucide-react";
import HeroSlider from "@/components/ui/HeroSlider";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const heroImages = [
  "/images/1-2.jpg",
  "/images/File_010.jpeg",
  "/images/PHOTO-2025-12-02-18-26-42 (5).jpg",
  "/images/Mamalou Kitchen - 165.jpg",
  "/images/File_001.jpeg",
];

const stats = [
  { value: "2000+", label: "Happy Kids" },
  { value: "500+", label: "Classes Held" },
  { value: "4.9", label: "Star Rating" },
  { value: "5+", label: "Years Experience" },
];

const galleryImages = [
  "/images/image0.png",
  "/images/IMG_3079_edited.jpg",
  "/images/File_000-2.jpeg",
  "/images/Mamalou Kitchen - 151.jpg",
  "/images/IMG_4199.jpg",
  "/images/File_010.jpeg",
];

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stats animation
      gsap.fromTo(
        ".hero-stats",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.3 }
      );

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
      {/* Hero Section - Modern Image Slider */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-8 bg-white overflow-hidden"
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <HeroSlider images={heroImages} autoPlayInterval={5000} />
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


      {/* Class Categories Section */}
      <section className="py-20 md:py-28 bg-[var(--c-warm)]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Small Chef */}
            <Link href="/book/birthday-deck" className="group relative overflow-hidden rounded-3xl aspect-[4/3] block">
              <Image
                src="/images/kids-classes.png"
                alt="Small Chef Classes"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>
                  Small Chef
                </h3>
                <p className="text-white/80 mt-2">Fun cooking classes for kids</p>
              </div>
            </Link>
            
            {/* Big Chef */}
            <Link href="/book/corporate-deck" className="group relative overflow-hidden rounded-3xl aspect-[4/3] block">
              <Image
                src="/images/adult-classes.png"
                alt="Big Chef Classes"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>
                  Big Chef
                </h3>
                <p className="text-white/80 mt-2">Corporate events & nanny classes</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section section py-24 md:py-32 overflow-hidden">
        <div className="container">
          <h2 className="section-title text-4xl md:text-6xl text-center mb-16" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>
            Life at Mamalu
          </h2>
          
          <div className="flex gap-4 overflow-hidden">
            {galleryImages.map((src, i) => (
              <div
                key={i}
                className="gallery-item flex-shrink-0 w-64 md:w-80 rounded-2xl overflow-hidden"
              >
                <Image
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  width={320}
                  height={500}
                  quality={100}
                  className="w-full h-auto object-contain hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="founder-section section py-24 md:py-32 bg-white">
        <div className="container">
          {/* Section Title */}
          <h2 className="text-center mb-16" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>
            <span className="text-4xl md:text-5xl tracking-wide text-[var(--c-black)]">OUR STORY</span>
            <span className="inline-block ml-2 text-[#f5d5d0]">❤</span>
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Image */}
            <div className="founder-image relative">
              <div className="aspect-[3/4] max-w-sm mx-auto overflow-hidden">
                <Image
                  src="/images/Lama_Jammal_pic.jpeg"
                  alt="Lama - Founder of Mamalu Kitchen"
                  fill
                  quality={100}
                  className="object-cover object-top"
                />
              </div>
            </div>

            {/* Content */}
            <div className="founder-content flex flex-col justify-center">
              <p className="text-lg md:text-xl text-[var(--c-gray)] mb-6 leading-relaxed" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>
                Mamalu Kitchen was inspired by her 3 boys and the need to help fellow mums and families simplify their day-to-day lives without having to worry about feeding their family fuss-free healthy food.
              </p>
              <p className="text-lg md:text-xl text-[var(--c-gray)] mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}>
                Mamalu Kitchen is creating a cooking movement under the slogan <span className="text-[var(--c-black)] font-semibold">#feedingfamilies</span>.
              </p>
              <Link href="/our-story" className="btn-primary group w-fit">
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
