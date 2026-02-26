"use client";

import Image from "next/image";
import Link from "next/link";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function WhatsHappeningSection() {
  const currentMonth = MONTH_NAMES[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <section className="py-16 md:py-20 bg-white relative overflow-hidden">
      {/* Decorative doodles */}
      <div className="absolute top-8 left-4 md:left-12 w-12 h-12 md:w-16 md:h-16 opacity-60">
        <Image src="/images/recipe-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-16 left-20 md:left-36 w-10 h-10 md:w-14 md:h-14 opacity-50">
        <Image src="/images/whisk-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-4 right-8 md:right-20 w-14 h-14 md:w-20 md:h-20 opacity-60">
        <Image src="/images/girl-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-20 right-4 md:right-8 w-10 h-10 md:w-12 md:h-12 opacity-50">
        <Image src="/images/potato-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-12 left-8 md:left-16 w-12 h-12 md:w-16 md:h-16 opacity-50">
        <Image src="/images/pot-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-8 right-12 md:right-24 w-14 h-14 md:w-18 md:h-18 opacity-60">
        <Image src="/images/skewers-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 left-2 md:left-8 w-10 h-10 md:w-14 md:h-14 opacity-40 -translate-y-1/2">
        <Image src="/images/gloves 2-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 right-2 md:right-8 w-12 h-12 md:w-16 md:h-16 opacity-50 -translate-y-1/2">
        <Image src="/images/salt-01.png" alt="" fill className="object-contain" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Title */}
        <h2 
          className="text-2xl md:text-3xl lg:text-4xl text-stone-900 mb-8 uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-mossy), cursive' }}
        >
          What&apos;s Happening at Mamalu Kitchen
        </h2>

        {/* Logo and Feeding Families */}
        <div className="flex items-center justify-center gap-6 md:gap-12 mb-6">
          <div className="hidden md:block">
            <Image 
              src="/images/arrow 2-01.png" 
              alt="" 
              width={80} 
              height={40} 
              className="opacity-60"
            />
          </div>
          
          <div className="w-20 h-20 md:w-24 md:h-24 relative">
            <Image 
              src="/images/mamalu-logo.png" 
              alt="Mamalu Kitchen" 
              fill 
              className="object-contain"
            />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Image 
              src="/images/arrow-01.png" 
              alt="" 
              width={60} 
              height={30} 
              className="opacity-60"
            />
            <span 
              className="text-lg text-stone-700 italic"
              style={{ fontFamily: 'var(--font-mossy), cursive' }}
            >
              Feeding Families
            </span>
          </div>
        </div>

        {/* PRESENTS */}
        <p 
          className="text-sm md:text-base text-stone-600 uppercase tracking-[0.3em] mb-2"
          style={{ fontFamily: 'var(--font-mossy), cursive' }}
        >
          Presents
        </p>

        {/* Month with hearts */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-2xl">💕</span>
          <Link 
            href="/whats-happening"
            className="text-3xl md:text-5xl lg:text-6xl text-[#e85a4f] hover:text-[#d14a3f] transition-colors uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mossy), cursive' }}
          >
            {currentMonth}
          </Link>
          <span className="text-2xl">💕</span>
        </div>

        {/* Click to view */}
        <Link 
          href="/whats-happening"
          className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
          style={{ fontFamily: 'var(--font-mossy), cursive' }}
        >
          View {currentMonth} {currentYear} Schedule
        </Link>
      </div>
    </section>
  );
}
