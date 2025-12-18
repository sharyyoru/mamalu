"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, User, ChevronDown, GraduationCap, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationLeft = [
  { name: "Home", href: "/" },
  { name: "Our Story", href: "/about" },
  { 
    name: "Classes", 
    href: "/classes",
    special: true,
    icon: GraduationCap,
    children: [
      { name: "Kids Classes", href: "/classes?type=kids" },
      { name: "Family Classes", href: "/classes?type=family" },
      { name: "Birthday Parties", href: "/classes?type=birthday" },
      { name: "Adult Classes", href: "/classes?type=adults" },
      { name: "All Classes", href: "/classes" },
    ],
  },
  { name: "Shop", href: "/products", special: true, icon: Store },
  { name: "Recipes", href: "/recipes" },
];

const navigationRight = [
  {
    name: "Services",
    href: "/services",
    special: false,
    children: [
      { name: "Private Events", href: "/services/events" },
      { name: "Food Consultancy", href: "/services/consultancy" },
    ],
  },
  { name: "Blog", href: "/blogs", special: false },
  { name: "Contact", href: "/contact", special: false },
];

const allNavigation = [...navigationLeft, ...navigationRight];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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
    
    // Custom event for same-tab updates
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const NavItem = ({ item }: { item: { name: string; href: string; special?: boolean; icon?: React.ComponentType<{ className?: string }>; children?: { name: string; href: string }[] } }) => {
    const Icon = item.icon;
    return (
    <div className="relative group">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium transition-all py-2",
          item.special 
            ? "bg-[#ff8c6b] text-white px-4 rounded-full hover:bg-[#e67854] shadow-md hover:shadow-lg" 
            : "text-stone-700 hover:text-[#ff8c6b]"
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {item.name}
        {item.children && <ChevronDown className={cn("h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity", item.special && "text-white")} />}
      </Link>
      {item.children && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-stone-100 py-3 min-w-[200px]">
            {item.children.map((child) => (
              <Link
                key={child.name}
                href={child.href}
                className="block px-4 py-2.5 text-sm text-stone-600 hover:bg-[#ff8c6b]/10 hover:text-[#ff8c6b] transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 lg:h-24 items-center justify-between">
          {/* Left Navigation - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-4 flex-1">
            {navigationLeft.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>

          {/* Center Logo - Big & Prominent (1.5x bigger) */}
          <div className="flex items-center justify-center lg:flex-none">
            <Link href="/" className="flex items-center justify-center transition-transform hover:scale-105">
              <Image 
                src="/graphics/mamalu-logo.avif" 
                alt="Mamalu Kitchen" 
                width={120} 
                height={120}
                className="h-14 w-auto sm:h-16 lg:h-[4.5rem]"
                priority
              />
            </Link>
          </div>

          {/* Right Navigation - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-5 flex-1 justify-end">
            {navigationRight.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            <Link href="/cart" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors ml-2">
              <ShoppingBag className="h-5 w-5 text-stone-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ff8c6b] text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <Link href="/account" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <User className="h-5 w-5 text-stone-700" />
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/cart" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors">
              <ShoppingBag className="h-5 w-5 text-stone-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ff8c6b] text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
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

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-500 ease-in-out",
            mobileMenuOpen ? "max-h-[80vh] pb-6 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-4 border-t border-stone-100">
            {/* Special Items - Classes & Shop */}
            <div className="flex gap-3 mb-4">
              <Link 
                href="/classes" 
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff8c6b] to-[#e67854] text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-[#ff8c6b]/20 hover:shadow-xl transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <GraduationCap className="h-4 w-4" />
                Classes
              </Link>
              <Link 
                href="/products" 
                className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-lg hover:bg-stone-800 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store className="h-4 w-4" />
                Shop
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1 bg-stone-50 rounded-xl p-3">
              {allNavigation.filter(item => !item.special).map((item, index) => (
                <div 
                  key={item.name}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between py-3 px-3 text-base font-medium text-stone-700 hover:text-[#ff8c6b] hover:bg-white rounded-lg transition-all"
                    onClick={() => !item.children && setMobileMenuOpen(false)}
                  >
                    {item.name}
                    {item.children && <ChevronDown className="h-4 w-4 text-stone-400" />}
                  </Link>
                  {item.children && (
                    <div className="pl-4 pb-2 space-y-1">
                      {item.children.map((child: { name: string; href: string }) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block py-2 px-3 text-sm text-stone-500 hover:text-[#ff8c6b] hover:bg-white rounded-lg transition-all"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-4 p-4 bg-gradient-to-r from-[#ff8c6b]/10 to-[#e67854]/10 rounded-xl">
              <p className="text-sm text-stone-600 mb-2">Ready to cook?</p>
              <Link 
                href="/classes" 
                className="flex items-center justify-center gap-2 bg-[#ff8c6b] text-white px-4 py-3 rounded-full text-sm font-semibold w-full hover:bg-[#e67854] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book a Class Today
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
