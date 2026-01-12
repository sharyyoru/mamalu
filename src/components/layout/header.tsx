"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, User, ChevronDown, GraduationCap, Store, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

const primaryNavigation = [
  { name: "Home", href: "/", icon: Home },
  { 
    name: "Classes", 
    href: "/classes",
    icon: GraduationCap,
    children: [
      { name: "Kids Classes", href: "/classes?type=kids", emoji: "👶" },
      { name: "Family Classes", href: "/classes?type=family", emoji: "👨‍👩‍👧" },
      { name: "Birthday Parties", href: "/classes?type=birthday", emoji: "🎂" },
      { name: "Adult Classes", href: "/classes?type=adults", emoji: "👨‍🍳" },
      { name: "All Classes", href: "/classes", emoji: "📚" },
    ],
  },
  { name: "Shop", href: "/products", icon: Store },
];

const secondaryNavigation = [
  { name: "Recipes", href: "/recipes" },
  { name: "Our Story", href: "/about" },
  {
    name: "Services",
    href: "/services",
    children: [
      { name: "Private Events", href: "/services/events" },
      { name: "Food Consultancy", href: "/services/consultancy" },
    ],
  },
  { name: "Blog", href: "/blogs" },
  { name: "Contact", href: "/contact" },
];

const allNavigation = [...primaryNavigation, ...secondaryNavigation];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load cart count from localStorage and listen for changes
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
    
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled 
        ? "glass shadow-lg shadow-black/5" 
        : "bg-white/95 backdrop-blur-sm"
    )}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 flex-shrink-0">
            <Image 
              src="/graphics/mamalu-logo.avif" 
              alt="Mamalu Kitchen" 
              width={100} 
              height={100}
              className="h-12 w-auto sm:h-14"
              priority
            />
          </Link>

          {/* Primary Navigation - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-1 flex-1 justify-center">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                      "bg-gradient-to-r from-[#ff8c6b]/0 to-[#ffa891]/0 hover:from-[#ff8c6b] hover:to-[#ffa891]",
                      "text-stone-700 hover:text-white",
                      "hover:shadow-lg hover:shadow-[#ff8c6b]/25"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {item.children && <ChevronDown className="h-4 w-4 opacity-60" />}
                  </Link>
                  
                  {/* Dropdown for Classes */}
                  {item.children && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="glass-card rounded-2xl p-2 min-w-[220px] shadow-xl">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-stone-600 hover:bg-[#ff8c6b]/10 hover:text-[#ff8c6b] transition-all"
                          >
                            <span className="text-lg">{child.emoji}</span>
                            <span className="font-medium">{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Section - Search, Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search */}
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>

            {/* Cart */}
            <Link 
              href="/cart" 
              className="relative p-2.5 rounded-full glass hover:bg-white/90 transition-all group"
            >
              <ShoppingBag className="h-5 w-5 text-stone-600 group-hover:text-[#ff8c6b] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-[#ff8c6b] to-[#e67854] text-[10px] font-bold text-white flex items-center justify-center shadow-lg animate-pulse-glow">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link 
              href="/account" 
              className="hidden sm:flex p-2.5 rounded-full glass hover:bg-white/90 transition-all group"
            >
              <User className="h-5 w-5 text-stone-600 group-hover:text-[#ff8c6b] transition-colors" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2.5 rounded-full glass hover:bg-white/90 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-stone-700" />
              ) : (
                <Menu className="h-5 w-5 text-stone-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-500 ease-in-out",
            mobileMenuOpen ? "max-h-[85vh] pb-6 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-4 space-y-4">
            {/* Mobile Search */}
            <div className="sm:hidden">
              <GlobalSearch />
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-3 gap-2">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:bg-[#ff8c6b]/10 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff8c6b] to-[#ffa891] flex items-center justify-center shadow-lg shadow-[#ff8c6b]/20 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-stone-700">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Class Types Quick Links */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Quick Book
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {primaryNavigation[1].children?.slice(0, 4).map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 hover:bg-[#ff8c6b]/10 text-stone-600 hover:text-[#ff8c6b] transition-all"
                  >
                    <span>{child.emoji}</span>
                    <span className="text-sm font-medium truncate">{child.name.replace(" Classes", "").replace(" Parties", "")}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Secondary Navigation */}
            <div className="glass-card rounded-2xl divide-y divide-stone-100">
              {secondaryNavigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => !item.children && setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-4 text-stone-700 hover:text-[#ff8c6b] transition-colors"
                  >
                    <span className="font-medium">{item.name}</span>
                    {item.children && <ChevronDown className="h-4 w-4 text-stone-400" />}
                  </Link>
                  {item.children && (
                    <div className="pb-2 px-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 px-3 text-sm text-stone-500 hover:text-[#ff8c6b] hover:bg-[#ff8c6b]/5 rounded-lg transition-all"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Account Link Mobile */}
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-3 rounded-full glass-card text-stone-700 font-medium hover:text-[#ff8c6b] transition-colors"
            >
              <User className="h-4 w-4" />
              My Account
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
