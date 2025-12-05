"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingBag, User, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Recipes", href: "/recipes" },
  { name: "Products", href: "/products" },
  { name: "Classes", href: "/classes" },
  { name: "Blogs", href: "/blogs" },
  { name: "Press", href: "/press" },
  {
    name: "Our Services",
    href: "/services",
    children: [
      { name: "Events", href: "/services/events" },
      { name: "Food Consultancy", href: "/services/consultancy" },
    ],
  },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-stone-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-amber-600" />
              <span className="text-xl font-bold text-stone-900">Mamalu</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className="text-sm font-medium text-stone-700 hover:text-amber-600 transition-colors"
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-white rounded-lg shadow-lg border border-stone-200 py-2 min-w-[180px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-amber-600"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative">
              <ShoppingBag className="h-6 w-6 text-stone-700 hover:text-amber-600 transition-colors" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-600 text-[10px] font-medium text-white flex items-center justify-center">
                0
              </span>
            </Link>
            <Link href="/account">
              <User className="h-6 w-6 text-stone-700 hover:text-amber-600 transition-colors" />
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden"
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
            mobileMenuOpen ? "max-h-screen pb-4" : "max-h-0"
          )}
        >
          <div className="space-y-1 pt-4">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="block py-2 text-base font-medium text-stone-700 hover:text-amber-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block py-2 text-sm text-stone-600 hover:text-amber-600"
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
        </div>
      </nav>
    </header>
  );
}
