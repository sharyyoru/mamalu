"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ShoppingBag, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationLeft = [
  { name: "Home", href: "/" },
  { name: "Our Story", href: "/about" },
  { 
    name: "Classes", 
    href: "/classes",
    children: [
      { name: "Kids Classes", href: "/classes?type=kids" },
      { name: "Family Classes", href: "/classes?type=family" },
      { name: "Birthday Parties", href: "/classes?type=birthday" },
      { name: "Adult Classes", href: "/classes?type=adults" },
      { name: "All Classes", href: "/classes" },
    ],
  },
  { name: "Recipes", href: "/recipes" },
];

const navigationRight = [
  { name: "Shop", href: "/products" },
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

const allNavigation = [...navigationLeft, ...navigationRight];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavItem = ({ item }: { item: typeof navigationLeft[0] }) => (
    <div className="relative group">
      <Link
        href={item.href}
        className="flex items-center gap-1 text-sm font-medium text-stone-700 hover:text-amber-600 transition-colors py-2"
      >
        {item.name}
        {item.children && <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />}
      </Link>
      {item.children && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-stone-100 py-3 min-w-[200px]">
            {item.children.map((child) => (
              <Link
                key={child.name}
                href={child.href}
                className="block px-4 py-2.5 text-sm text-stone-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-stone-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          {/* Left Navigation - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-5 flex-1">
            {navigationLeft.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>

          {/* Center Logo - Big & Prominent */}
          <div className="flex items-center justify-center lg:flex-none">
            <Link href="/" className="flex items-center justify-center transition-transform hover:scale-105">
              <Image 
                src="/graphics/mamalu-logo.avif" 
                alt="Mamalu Kitchen" 
                width={80} 
                height={80}
                className="h-16 w-auto lg:h-20"
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
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-medium text-white flex items-center justify-center">
                0
              </span>
            </Link>
            <Link href="/account" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <User className="h-5 w-5 text-stone-700" />
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/cart" className="relative p-2 hover:bg-stone-100 rounded-full transition-colors">
              <ShoppingBag className="h-5 w-5 text-stone-700" />
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-medium text-white flex items-center justify-center">
                0
              </span>
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
            "lg:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-[80vh] pb-6" : "max-h-0"
          )}
        >
          <div className="space-y-1 pt-4 border-t border-stone-100">
            {allNavigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between py-3 text-base font-medium text-stone-700 hover:text-amber-600"
                  onClick={() => !item.children && setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="pl-4 pb-2 space-y-1">
                    {item.children.map((child: { name: string; href: string }) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block py-2 text-sm text-stone-500 hover:text-amber-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4">
              <Link 
                href="/classes" 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl text-sm font-medium w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book a Class
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
