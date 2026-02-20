"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Shop", href: "/products" },
  { name: "Blog", href: "/blogs" },
  { name: "Contacts", href: "/contact" },
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
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white",
        scrolled ? "py-3 shadow-sm" : "py-5"
      )}>
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Left: Logo + Nav Links */}
            <div className="flex items-center gap-16">
              {/* Logo - Much Bigger */}
              <Link 
                href="/" 
                className={cn(
                  "transition-all duration-500",
                  scrolled ? "scale-90" : "scale-100"
                )}
              >
                <Image 
                  src="/graphics/mamalu-logo.avif" 
                  alt="Mamalu Kitchen" 
                  width={200} 
                  height={80}
                  className={cn(
                    "w-auto transition-all duration-500",
                    scrolled ? "h-16" : "h-20 lg:h-24"
                  )}
                  priority
                />
              </Link>

              {/* Desktop Nav Links - Stacked Style like mybird */}
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
            </div>

            {/* Center: Globe Badge with Icon - like mybird */}
            <div className="hidden lg:flex flex-col items-center absolute left-1/2 -translate-x-1/2">
              <div className={cn(
                "relative w-14 h-14 rounded-full bg-[var(--c-accent)] flex items-center justify-center transition-all duration-500 group hover:scale-110",
                scrolled ? "scale-75" : "scale-100"
              )}>
                {/* Globe/Earth icon like mybird */}
                <svg className="w-7 h-7 text-[var(--c-accent-dark)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {/* Decorative horizontal lines through globe */}
                <div className="absolute top-1/2 -left-4 w-4 h-px bg-[var(--c-accent-dark)]" />
                <div className="absolute top-1/2 -right-4 w-4 h-px bg-[var(--c-accent-dark)]" />
              </div>
              <span className={cn(
                "mt-2 text-[9px] font-bold text-[var(--c-accent-dark)] uppercase tracking-[0.15em] transition-all duration-500 text-center leading-tight",
                scrolled ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
              )}>
                #FEEDING<br/>FAMILIES
              </span>
            </div>

            {/* Right: Cart Button */}
            <div className="flex items-center gap-4">
              {/* Cart Button - pill style like mybird */}
              <Link
                href="/cart"
                className={cn(
                  "relative flex items-center gap-3 px-5 py-2.5 rounded-full border border-[var(--c-gray-light)] bg-white text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:border-[var(--c-black)]",
                  scrolled ? "px-4 py-2 text-xs" : ""
                )}
              >
                <span className="text-[var(--c-black)]">Cart ({cartCount})</span>
                {/* Striped circle icon like mybird */}
                <div className="w-8 h-8 rounded-full bg-[var(--c-accent)] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full" style={{
                    background: `repeating-linear-gradient(
                      90deg,
                      var(--c-accent-dark) 0px,
                      var(--c-accent-dark) 2px,
                      var(--c-accent) 2px,
                      var(--c-accent) 4px
                    )`
                  }} />
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-full hover:bg-[var(--c-warm)] transition-colors"
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
      </header>

      {/* Wavy Cut Section - White to Mint like mybird */}
      <div className="fixed top-[88px] lg:top-[104px] left-0 right-0 z-40 pointer-events-none overflow-hidden h-12">
        <svg 
          viewBox="0 0 1440 50" 
          className="w-full h-full" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0 L1440,0 L1440,20 C1200,50 900,10 600,30 C300,50 100,20 0,35 L0,0 Z" 
            fill="var(--c-accent-light)"
          />
        </svg>
      </div>

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
