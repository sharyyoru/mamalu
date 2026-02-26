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
      {/* Decorative doodles - 2 on mobile sides, more on larger screens */}
      {/* Mobile: 2 small doodles on sides */}
      <div className="absolute top-1/2 left-1 w-10 h-10 md:hidden opacity-50 -translate-y-1/2">
        <Image src="/images/pot-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-1/2 right-1 w-10 h-10 md:hidden opacity-50 -translate-y-1/2">
        <Image src="/images/skewers-01.png" alt="" fill className="object-contain" />
      </div>
      
      {/* Desktop: bottom doodles only */}
      <div className="hidden md:block absolute bottom-8 left-20 lg:left-24 w-24 h-24 opacity-60">
        <Image src="/images/pot-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="hidden md:block absolute bottom-6 right-28 lg:right-32 w-24 h-24 opacity-70">
        <Image src="/images/skewers-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="hidden lg:block absolute top-1/2 left-10 w-20 h-20 opacity-50 -translate-y-1/2">
        <Image src="/images/gloves 2-01.png" alt="" fill className="object-contain" />
      </div>
      <div className="hidden lg:block absolute top-1/2 right-10 w-22 h-22 opacity-60 -translate-y-1/2">
        <Image src="/images/salt-01.png" alt="" fill className="object-contain" />
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-4 text-center relative z-10 max-w-3xl">
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
