"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, User, ChevronDown, GraduationCap, Store, Home, Sparkles, Search, Baby, Users, Cake, ChefHat, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

const primaryNavigation = [
  { name: "Home", href: "/", icon: Home },
  { 
    name: "Classes", 
    href: "/classes",
    icon: GraduationCap,
    hasMegaMenu: true,
  },
  { name: "Shop", href: "/products", icon: Store },
];

const classCategories = [
  { 
    name: "Kids Classes", 
    href: "/classes?type=kids", 
    emoji: "👶",
    icon: Baby,
    description: "Fun cooking adventures for little chefs aged 4-12",
    color: "from-pink-500 to-rose-500"
  },
  { 
    name: "Family Classes", 
    href: "/classes?type=family", 
    emoji: "👨‍👩‍👧",
    icon: Users,
    description: "Cook together, bond together - memories that last forever",
    color: "from-amber-500 to-orange-500"
  },
  { 
    name: "Birthday Parties", 
    href: "/classes?type=birthday", 
    emoji: "🎂",
    icon: Cake,
    description: "Celebrate with a unique cooking party experience",
    color: "from-violet-500 to-purple-600"
  },
  { 
    name: "Adult Classes", 
    href: "/classes?type=adults", 
    emoji: "👨‍🍳",
    icon: ChefHat,
    description: "Master new cuisines and techniques with expert guidance",
    color: "from-emerald-500 to-teal-600"
  },
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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
        ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/5" 
        : "bg-white"
    )}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 lg:h-24 items-center justify-between gap-4">
          {/* Logo - Bigger */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 flex-shrink-0">
            <Image 
              src="/graphics/mamalu-logo.avif" 
              alt="Mamalu Kitchen" 
              width={120} 
              height={120}
              className="h-14 w-auto sm:h-16 lg:h-20"
              priority
            />
          </Link>

          {/* Primary Navigation - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.name} 
                  className="relative"
                  onMouseEnter={() => item.hasMegaMenu && setMegaMenuOpen(true)}
                  onMouseLeave={() => item.hasMegaMenu && setMegaMenuOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
                      "text-stone-700 hover:text-[#ff8c6b]",
                      "hover:bg-stone-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {item.hasMegaMenu && <ChevronDown className={cn("h-4 w-4 transition-transform", megaMenuOpen && "rotate-180")} />}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Prominent Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <GlobalSearch />
          </div>

          {/* Right Section - Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search trigger for tablet */}
            <div className="hidden sm:block lg:hidden">
              <GlobalSearch />
            </div>

            {/* Cart */}
            <Link 
              href="/cart" 
              className="relative p-2.5 rounded-full hover:bg-stone-100 transition-all group"
            >
              <ShoppingBag className="h-5 w-5 text-stone-700 group-hover:text-[#ff8c6b] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-[#ff8c6b] to-[#e67854] text-[10px] font-bold text-white flex items-center justify-center shadow-lg">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link 
              href="/account" 
              className="hidden sm:flex p-2.5 rounded-full hover:bg-stone-100 transition-all group"
            >
              <User className="h-5 w-5 text-stone-700 group-hover:text-[#ff8c6b] transition-colors" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2.5 rounded-full hover:bg-stone-100 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-stone-700" />
              ) : (
                <Menu className="h-6 w-6 text-stone-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mega Menu for Classes - Full Width, 100% Opacity */}
      <div 
        className={cn(
          "absolute left-0 right-0 top-full bg-white border-t border-stone-100 shadow-2xl transition-all duration-300 z-40 hidden lg:block",
          megaMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
        )}
        onMouseEnter={() => setMegaMenuOpen(true)}
        onMouseLeave={() => setMegaMenuOpen(false)}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-4 gap-6">
            {classCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group p-5 rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all bg-white hover:bg-stone-50"
                >
                  <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", category.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-stone-900 mb-1 group-hover:text-[#ff8c6b] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-stone-500 line-clamp-2">
                    {category.description}
                  </p>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              Can&apos;t decide? Browse all our classes and find the perfect fit.
            </p>
            <Link 
              href="/classes" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff8c6b] to-[#ffa891] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#ff8c6b]/25 transition-all"
            >
              <Calendar className="h-4 w-4" />
              View All Classes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Modern & Exciting */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-20 bg-white z-40 transition-all duration-500 ease-in-out overflow-y-auto",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <div className="p-4 space-y-4 pb-24">
          {/* Mobile Search - Prominent */}
          <div className="relative">
            <GlobalSearch />
          </div>

          {/* Primary Actions - Colorful Cards */}
          <div className="grid grid-cols-3 gap-3">
            {primaryNavigation.map((item, idx) => {
              const Icon = item.icon;
              const colors = ["from-[#ff8c6b] to-[#e67854]", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600"];
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-all group active:scale-95"
                >
                  <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", colors[idx])}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-stone-900">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Class Categories - Visual Grid */}
          <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-3xl p-4">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ff8c6b]" />
              Quick Book a Class
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {classCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.name}
                    href={category.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0", category.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-stone-700 truncate">{category.name.replace(" Classes", "").replace(" Parties", "")}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Secondary Navigation - Clean List */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            {secondaryNavigation.map((item, idx) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => !item.children && setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between py-4 px-5 text-stone-700 hover:text-[#ff8c6b] hover:bg-stone-50 transition-all",
                    idx !== 0 && "border-t border-stone-100"
                  )}
                >
                  <span className="font-semibold">{item.name}</span>
                  {item.children ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ArrowRight className="h-4 w-4 text-stone-300" />}
                </Link>
                {item.children && (
                  <div className="bg-stone-50 px-5 py-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2.5 text-sm text-stone-500 hover:text-[#ff8c6b] transition-all"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Account Button */}
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <User className="h-5 w-5" />
            My Account
          </Link>
        </div>
      </div>
    </header>
  );
}
