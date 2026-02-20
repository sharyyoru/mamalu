"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Kids", href: "/classes/kids" },
  { name: "Adults", href: "/book?category=adults" },
  { name: "Corporate", href: "/book/corporate-deck" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
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

  return (
    <>
      {/* Header with Peach Background */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[var(--c-peach)]",
        scrolled ? "py-2" : "py-4"
      )}>
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between relative">
            
            {/* Left: Nav Links - Stacked Style */}
            <div className="hidden lg:flex flex-col gap-0.5">
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

            {/* Center: Logo - Big and Centered */}
            <Link 
              href="/" 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 transition-all duration-500",
                scrolled ? "scale-75" : "scale-100"
              )}
            >
              <Image 
                src="/graphics/mamalu-logo.avif" 
                alt="Mamalu Kitchen" 
                width={280} 
                height={120}
                className={cn(
                  "w-auto transition-all duration-500",
                  scrolled ? "h-16" : "h-24 lg:h-28"
                )}
                priority
              />
            </Link>

            {/* Right: Cart Button with Lunch Bag Doodle */}
            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <Link
                href="/cart"
                className={cn(
                  "relative flex items-center gap-3 px-5 py-2.5 rounded-full border border-[var(--c-black)]/20 bg-white text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:border-[var(--c-black)]",
                  scrolled ? "px-4 py-2 text-xs" : ""
                )}
              >
                <span className="text-[var(--c-black)]">Cart ({cartCount})</span>
                {/* Lunch bag doodle as cart icon */}
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
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-[var(--c-black)]" />
                ) : (
                  <Menu className="h-6 w-6 text-[var(--c-black)]" />
                )}
              </button>
            </div>
          </div>
        </nav>
        
        {/* Wavy Cut - Part of header, transitions to white */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full h-8 pointer-events-none">
          <svg 
            viewBox="0 0 1440 32" 
            className="w-full h-full" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0 L1440,0 L1440,8 C1200,32 900,4 600,16 C300,28 100,8 0,20 L0,0 Z" 
              fill="var(--c-peach)"
            />
          </svg>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-24 bg-white z-40 transition-all duration-500",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-4xl font-bold text-[var(--c-black)] hover:opacity-60 transition-opacity uppercase"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/classes"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-8 px-8 py-4 bg-[var(--c-black)] text-white text-xl font-bold rounded-full uppercase tracking-wide"
          >
            Book a Class
          </Link>
        </div>
      </div>
    </>
  );
}
