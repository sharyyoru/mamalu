"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Kids", href: "/classes/kids" },
  { name: "Adults", href: "/book?category=adults" },
  { name: "Corporate", href: "/book/corporate-deck" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("mamalu_cart") || "[]");
        const count = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      {/* Header - White default, transparent on scroll like mybird.com */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-transparent" : "bg-white"
      )}>
        <nav className="container mx-auto px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between relative transition-all duration-500",
            scrolled ? "py-2" : "py-4"
          )}>
            
            {/* Left: Nav Links - Horizontal layout, 2x bigger text, line separators */}
            <div className={cn(
              "hidden lg:flex flex-row items-center gap-6 transition-all duration-500 z-10",
              scrolled ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 translate-x-0"
            )}>
              {navLinks.map((link, index) => (
                <div key={link.name} className="flex items-center gap-6">
                  <Link
                    href={link.href}
                    className="text-xl font-bold text-[var(--c-black)] hover:opacity-60 transition-opacity uppercase whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-patrick-hand), cursive' }}
                  >
                    {link.name}
                  </Link>
                  {index < navLinks.length - 1 && (
                    <div className="w-px h-5 bg-[var(--c-black)]/20" />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: Menu button on left (hidden on desktop, hidden on scroll) */}
            <button
              type="button"
              className={cn(
                "lg:hidden p-2 transition-all duration-500",
                scrolled ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
              onClick={() => setMenuOpen(true)}
            >
              <svg className="h-6 w-6 text-[var(--c-black)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Center: Logo + Open Menu (on scroll) - positioned to overflow into hero */}
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-500 z-0",
              scrolled ? "top-1" : "top-0"
            )}>
              {/* White rounded rectangle background with shadow on scroll */}
              <div className={cn(
                "flex flex-col items-center transition-all duration-500 cursor-pointer",
                scrolled ? "bg-white rounded-2xl px-6 py-3 shadow-lg" : ""
              )}
              onClick={() => scrolled && setMenuOpen(true)}
              >
                {/* Logo - links home when not scrolled, opens menu when scrolled */}
                {scrolled ? (
                  <Image 
                    src="/graphics/mamalu-logo-transparent.png" 
                    alt="Mamalu Kitchen" 
                    width={160} 
                    height={160}
                    className="w-12 h-12 transition-all duration-500"
                    priority
                  />
                ) : (
                  <Link href="/">
                    <Image 
                      src="/graphics/mamalu-logo-transparent.png" 
                      alt="Mamalu Kitchen" 
                      width={160} 
                      height={160}
                      className="w-20 h-20 lg:w-24 lg:h-24 transition-all duration-500"
                      priority
                    />
                  </Link>
                )}
                
                {/* Open Menu Text - appears on scroll */}
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest text-[var(--c-black)] transition-all duration-500 mt-1 whitespace-nowrap",
                  scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  Open Menu
                </span>
              </div>
            </div>

            {/* Right: Cart Button (hidden on scroll) */}
            <div className={cn(
              "flex items-center gap-4 transition-all duration-500",
              scrolled ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
            )}>
              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--c-black)]/20 bg-white text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:border-[var(--c-black)]"
              >
                <span className="text-[var(--c-black)] hidden sm:inline">Cart ({cartCount})</span>
                <span className="text-[var(--c-black)] sm:hidden">{cartCount}</span>
                <div className="w-6 h-6 sm:w-8 sm:h-8 relative">
                  <Image 
                    src="/images/lunch-bag.png" 
                    alt="Cart" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Fullscreen Menu Overlay - white bg, centered logo, peach highlights */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-700",
          menuOpen ? "visible" : "invisible pointer-events-none"
        )}
      >
        {/* White Background */}
        <div 
          className={cn(
            "absolute inset-0 bg-white transition-transform duration-700 ease-out",
            menuOpen ? "translate-y-0" : "-translate-y-full"
          )}
        />
        
        {/* Menu Content */}
        <div className={cn(
          "relative h-full flex flex-col transition-opacity duration-500 delay-300",
          menuOpen ? "opacity-100" : "opacity-0"
        )}>
          {/* Top Bar - Centered Logo (2x bigger) and Close */}
          <div className="flex items-center justify-center px-6 lg:px-12 py-8 relative">
            <Link href="/" onClick={() => setMenuOpen(false)} className="mx-auto">
              <Image 
                src="/graphics/mamalu-logo-transparent.png" 
                alt="Mamalu Kitchen" 
                width={160} 
                height={160}
                className="w-28 h-28 md:w-32 md:h-32"
              />
            </Link>
            
            {/* Close Button - positioned absolute right */}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute right-6 lg:right-12 flex flex-col items-center gap-1 group"
            >
              <X className="w-8 h-8 text-[var(--c-black)] group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-black)]">Close</span>
            </button>
          </div>

          {/* Menu Links - Large centered text with peach underline highlight on hover */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 relative z-10">
            {[{ name: "Home", href: "/" }, ...navLinks].map((link, i) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "relative text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--c-black)] transition-all duration-500 uppercase tracking-tight group",
                  menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}
                style={{ 
                  transitionDelay: menuOpen ? `${300 + i * 100}ms` : '0ms',
                  fontFamily: 'var(--font-patrick-hand), cursive'
                }}
              >
                <span className="relative z-10">{link.name}</span>
                {/* Peach highlight underline on hover */}
                <span className="absolute bottom-0 left-0 w-full h-3 bg-[var(--c-peach)] -z-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>

          {/* Bottom Info - Contact details */}
          <div className="flex items-center justify-between px-6 lg:px-12 py-6 text-sm">
            <a href="tel:+971585003031" className="text-[var(--c-black)] hover:text-[var(--c-peach-dark)] transition-colors">
              +971 58 500 3031
            </a>
            <a href="mailto:info@mamalukitchen.com" className="text-[var(--c-black)] hover:text-[var(--c-peach-dark)] transition-colors">
              info@mamalukitchen.com
            </a>
          </div>
        </div>

        {/* Decorative floating GIFs - 2.5x bigger, closer to center, visible on all screens */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 left-[10%] md:left-[15%] lg:left-[20%] w-24 h-24 md:w-48 md:h-48 lg:w-56 lg:h-56 transition-all duration-700 delay-500 pointer-events-none",
          menuOpen ? "opacity-70 translate-x-0" : "opacity-0 -translate-x-12"
        )}>
          <Image 
            src="/graphics/happy-kids.gif" 
            alt="" 
            width={224}
            height={224}
            className="w-full h-full object-contain"
            unoptimized
          />
        </div>
        
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 right-[10%] md:right-[15%] lg:right-[20%] w-24 h-24 md:w-48 md:h-48 lg:w-56 lg:h-56 transition-all duration-700 delay-600 pointer-events-none",
          menuOpen ? "opacity-70 translate-x-0" : "opacity-0 translate-x-12"
        )}>
          <Image 
            src="/graphics/classes.gif" 
            alt="" 
            width={224}
            height={224}
            className="w-full h-full object-contain"
            unoptimized
          />
        </div>
      </div>
    </>
  );
}
