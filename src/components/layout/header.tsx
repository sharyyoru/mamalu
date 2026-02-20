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
      {/* Header - Transparent like mybird.com */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "py-2 bg-white/90 backdrop-blur-md shadow-sm" : "py-4 bg-transparent"
      )}>
        <nav className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between relative min-h-[60px]">
            
            {/* Left: Nav Links - Aligned to content area (hidden on scroll) */}
            <div className={cn(
              "hidden lg:flex flex-col gap-0.5 transition-all duration-500",
              scrolled ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 translate-x-0"
            )}>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-bold text-[var(--c-black)] hover:opacity-60 transition-opacity uppercase tracking-wide"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Center: Logo + Open Menu (on scroll) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <Link href="/" className="transition-all duration-500">
                <Image 
                  src="/graphics/mamalu-logo-transparent.png" 
                  alt="Mamalu Kitchen" 
                  width={140} 
                  height={140}
                  className={cn(
                    "transition-all duration-500",
                    scrolled ? "w-20 h-20" : "w-28 h-28 lg:w-32 lg:h-32"
                  )}
                  priority
                />
              </Link>
              
              {/* Open Menu Button - appears on scroll */}
              <button
                onClick={() => setMenuOpen(true)}
                className={cn(
                  "text-xs font-bold uppercase tracking-widest text-[var(--c-black)] hover:opacity-60 transition-all duration-500 mt-1",
                  scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                )}
              >
                Open Menu
              </button>
            </div>

            {/* Right: Cart Button (hidden on scroll) */}
            <div className={cn(
              "flex items-center gap-4 transition-all duration-500",
              scrolled ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
            )}>
              <Link
                href="/cart"
                className="relative flex items-center gap-3 px-5 py-2.5 rounded-full border border-[var(--c-black)]/20 bg-white text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:border-[var(--c-black)]"
              >
                <span className="text-[var(--c-black)]">Cart ({cartCount})</span>
                <div className="w-8 h-8 relative">
                  <Image 
                    src="/images/lunch-bag.png" 
                    alt="Cart" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-full hover:bg-white/50 transition-colors"
                onClick={() => setMenuOpen(true)}
              >
                <svg className="h-6 w-6 text-[var(--c-black)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Fullscreen Menu Overlay - mybird.com style */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-700",
          menuOpen ? "visible" : "invisible pointer-events-none"
        )}
      >
        {/* Peach Background */}
        <div 
          className={cn(
            "absolute inset-0 bg-[var(--c-peach)] transition-transform duration-700 ease-out",
            menuOpen ? "translate-y-0" : "-translate-y-full"
          )}
        />
        
        {/* Menu Content */}
        <div className={cn(
          "relative h-full flex flex-col transition-opacity duration-500 delay-300",
          menuOpen ? "opacity-100" : "opacity-0"
        )}>
          {/* Top Bar - Logo and Close */}
          <div className="flex items-center justify-between px-6 lg:px-12 py-6">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <Image 
                src="/graphics/mamalu-logo-transparent.png" 
                alt="Mamalu Kitchen" 
                width={100} 
                height={100}
                className="w-16 h-16"
              />
            </Link>
            
            {/* Close Button - X icon like mybird */}
            <button
              onClick={() => setMenuOpen(false)}
              className="flex flex-col items-center gap-1 group"
            >
              <X className="w-8 h-8 text-[var(--c-black)] group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-black)]">Close</span>
            </button>
          </div>

          {/* Menu Links - Large centered text like mybird */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            {[{ name: "Home", href: "/" }, ...navLinks].map((link, i) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "text-5xl md:text-7xl lg:text-8xl font-bold text-[var(--c-black)] hover:opacity-60 transition-all duration-500 uppercase tracking-tight",
                  menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}
                style={{ 
                  transitionDelay: menuOpen ? `${300 + i * 100}ms` : '0ms',
                  fontFamily: 'var(--font-patrick-hand), cursive'
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Bottom Info - Contact details like mybird */}
          <div className="flex items-center justify-between px-6 lg:px-12 py-6 text-sm">
            <a href="tel:+971585003031" className="text-[var(--c-black)] hover:opacity-60 transition-opacity">
              +971 58 500 3031
            </a>
            <a href="mailto:info@mamalukitchen.com" className="text-[var(--c-black)] hover:opacity-60 transition-opacity">
              info@mamalukitchen.com
            </a>
          </div>
        </div>

        {/* Decorative floating images like mybird */}
        <div className={cn(
          "absolute top-1/4 left-8 w-32 h-40 transition-all duration-700 delay-500",
          menuOpen ? "opacity-60 translate-y-0 rotate-[-8deg]" : "opacity-0 translate-y-12 rotate-0"
        )}>
          <Image 
            src="/images/kids-classes.png" 
            alt="" 
            fill 
            className="object-cover rounded-2xl"
          />
        </div>
        
        <div className={cn(
          "absolute top-1/3 right-12 w-40 h-52 transition-all duration-700 delay-600",
          menuOpen ? "opacity-60 translate-y-0 rotate-[5deg]" : "opacity-0 translate-y-12 rotate-0"
        )}>
          <Image 
            src="/images/birthday-parties.png" 
            alt="" 
            fill 
            className="object-cover rounded-2xl"
          />
        </div>
      </div>
    </>
  );
}
