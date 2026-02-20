"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, ChefHat, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Classes", href: "/classes" },
  { name: "Shop", href: "/products" },
  { name: "About", href: "/about" },
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
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled ? "py-4" : "py-6"
    )}>
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-12">
            {/* Logo */}
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
                width={140} 
                height={60}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {/* Desktop Nav Links - Stacked Style */}
            <div className="hidden lg:flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-bold text-[var(--c-black)] hover:text-[var(--c-peach)] transition-colors uppercase tracking-wide"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Center: Badge with Icon */}
          <div className="hidden lg:flex flex-col items-center absolute left-1/2 -translate-x-1/2">
            <div className={cn(
              "relative w-16 h-16 rounded-full bg-[var(--c-peach)] flex items-center justify-center shadow-lg transition-all duration-500 group hover:scale-110",
              scrolled ? "scale-75" : "scale-100"
            )}>
              <ChefHat className="w-7 h-7 text-white" />
              {/* Decorative lines */}
              <div className="absolute -top-3 left-1/2 w-px h-3 bg-[var(--c-peach-light)]" />
              <div className="absolute -bottom-3 left-1/2 w-px h-3 bg-[var(--c-peach-light)]" />
            </div>
            <span className={cn(
              "mt-2 text-[10px] font-bold text-[var(--c-peach)] uppercase tracking-[0.2em] transition-all duration-500",
              scrolled ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
            )}>
              #FeedingFamilies
            </span>
          </div>

          {/* Right: Book Button + Cart */}
          <div className="flex items-center gap-4">
            {/* Book Now Button */}
            <Link
              href="/classes"
              className={cn(
                "hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--c-black)] text-sm font-bold uppercase tracking-wide transition-all duration-300",
                "hover:bg-[var(--c-black)] hover:text-white",
                scrolled ? "px-4 py-2 text-xs" : ""
              )}
            >
              <Calendar className="w-4 h-4" />
              Book Now
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--c-black)] text-white text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:bg-[var(--c-peach)]",
                scrolled ? "px-4 py-2 text-xs" : ""
              )}
            >
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-[var(--c-black)] text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
              <ShoppingBag className="w-4 h-4" />
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

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-20 bg-[var(--c-cream)] z-40 transition-all duration-500",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-4xl font-bold text-[var(--c-black)] hover:text-[var(--c-peach)] transition-colors uppercase"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/classes"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-8 px-8 py-4 bg-[var(--c-peach)] text-white text-xl font-bold rounded-full uppercase tracking-wide"
          >
            Book a Class
          </Link>
        </div>
      </div>
    </header>
  );
}
