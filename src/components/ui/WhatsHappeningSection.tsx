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
    <section className="py-16 md:py-24 bg-stone-100 relative overflow-hidden">
      {/* Decorative doodles - bigger sizes */}
      <div className="absolute top-6 left-4 md:left-16 w-16 h-16 md:w-24 md:h-24 opacity-70">
        <Image src="/images/recipe-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-20 left-24 md:left-44 w-14 h-14 md:w-20 md:h-20 opacity-60">
        <Image src="/images/whisk-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-4 right-8 md:right-24 w-20 h-20 md:w-28 md:h-28 opacity-70">
        <Image src="/images/girl-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-24 right-4 md:right-12 w-14 h-14 md:w-18 md:h-18 opacity-60">
        <Image src="/images/potato-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-8 left-8 md:left-20 w-16 h-16 md:w-24 md:h-24 opacity-60">
        <Image src="/images/pot-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-6 right-8 md:right-28 w-18 h-18 md:w-24 md:h-24 opacity-70">
        <Image src="/images/skewers-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 left-2 md:left-10 w-14 h-14 md:w-20 md:h-20 opacity-50 -translate-y-1/2">
        <Image src="/images/gloves 2-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 right-2 md:right-10 w-16 h-16 md:w-22 md:h-22 opacity-60 -translate-y-1/2">
        <Image src="/images/salt-01.png" alt="" fill className="object-contain" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Title */}
        <h2 
          className="text-2xl md:text-3xl lg:text-4xl text-stone-900 mb-10 uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-mossy), cursive' }}
        >
          What&apos;s Happening at Mamalu Kitchen
        </h2>

        {/* Feeding Families */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="hidden md:block">
            <Image 
              src="/images/arrow 2-01.png" 
              alt="" 
              width={80} 
              height={40} 
              className="opacity-70"
            />
          </div>
          
          <span 
            className="text-xl md:text-2xl text-stone-700 italic"
            style={{ fontFamily: 'var(--font-mossy), cursive' }}
          >
            Feeding Families
          </span>

          <div className="hidden md:block">
            <Image 
              src="/images/arrow-01.png" 
              alt="" 
              width={80} 
              height={40} 
              className="opacity-70"
            />
          </div>
        </div>

        {/* PRESENTS */}
        <p 
          className="text-sm md:text-base text-stone-600 uppercase tracking-[0.3em] mb-3"
          style={{ fontFamily: 'var(--font-mossy), cursive' }}
        >
          Presents
        </p>

        {/* Month with hearts */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="text-3xl">💕</span>
          <Link 
            href="/whats-happening"
            className="text-4xl md:text-6xl lg:text-7xl text-[#e85a4f] hover:text-[#d14a3f] transition-colors uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mossy), cursive' }}
          >
            {currentMonth}
          </Link>
          <span className="text-3xl">💕</span>
        </div>

        {/* Click to view - Peach button style */}
        <Link 
          href="/whats-happening"
          className="inline-block px-10 py-4 bg-[#f5e6dc] text-stone-800 border border-stone-300 rounded-full hover:bg-[#f0ddd0] transition-colors uppercase tracking-wider text-sm md:text-base"
          style={{ fontFamily: 'var(--font-mossy), cursive' }}
        >
          View {currentMonth} {currentYear} Schedule
        </Link>
      </div>
    </section>
  );
}
