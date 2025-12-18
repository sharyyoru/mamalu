"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Filter, ArrowRight, Search, X, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

interface Product {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  price: number;
  compareAtPrice?: number;
  images?: { asset: { _ref: string }; alt?: string }[];
  imageUrl?: string | null;
  categories?: Category[];
  inStock: boolean;
  featured?: boolean;
}

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
}

type SortOption = "latest" | "a-z" | "z-a" | "price-low" | "price-high";

export default function ProductsClient({
  products,
  categories,
}: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allCategories = [
    { _id: "all", title: "All", slug: { current: "all" } },
    ...categories,
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "latest", label: "Latest" },
    { value: "a-z", label: "A-Z" },
    { value: "z-a", label: "Z-A" },
    { value: "price-low", label: "Price (Low to High)" },
    { value: "price-high", label: "Price (High to Low)" },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter((p) =>
        p.categories?.some((c) => c.slug.current === activeCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "a-z":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "z-a":
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("mamalu_cart") || "[]");
    const existingItem = cart.find((item: { id: string }) => item.id === product._id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product._id,
        title: product.title,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
      });
    }
    
    localStorage.setItem("mamalu_cart", JSON.stringify(cart));
    // Trigger storage event for other components
    window.dispatchEvent(new Event("storage"));
    alert(`${product.title} added to cart!`);
  };

  const Sidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Categories</h3>
        <div className="space-y-2">
          {allCategories.map((category) => (
            <button
              key={category._id}
              onClick={() => setActiveCategory(category.slug.current)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === category.slug.current
                  ? "bg-[#ff8c6b] text-white font-medium"
                  : "text-stone-600 hover:bg-[#ff8c6b]/10 hover:text-[#ff8c6b]"
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Sort by</h3>
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={() => setSortBy(option.value)}
                className="w-4 h-4 text-[#ff8c6b] border-stone-300 focus:ring-[#ff8c6b]"
              />
              <span className={`text-sm ${sortBy === option.value ? "text-[#ff8c6b] font-medium" : "text-stone-600 group-hover:text-[#ff8c6b]"}`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28">
              <Sidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Mobile Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 border-stone-200 focus:border-[#ff8c6b] focus:ring-[#ff8c6b]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                className="lg:hidden flex items-center gap-2"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </Button>
            </div>

            {/* Active Filters */}
            {(activeCategory !== "all" || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-stone-500">Active filters:</span>
                {activeCategory !== "all" && (
                  <Badge 
                    className="bg-[#ff8c6b]/10 text-[#ff8c6b] hover:bg-[#ff8c6b]/20 cursor-pointer"
                    onClick={() => setActiveCategory("all")}
                  >
                    {allCategories.find(c => c.slug.current === activeCategory)?.title}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge 
                    className="bg-[#ff8c6b]/10 text-[#ff8c6b] hover:bg-[#ff8c6b]/20 cursor-pointer"
                    onClick={() => setSearchQuery("")}
                  >
                    &quot;{searchQuery}&quot;
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setSearchQuery("");
                  }}
                  className="text-sm text-stone-500 hover:text-[#ff8c6b] underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Results Count */}
            <p className="text-sm text-stone-500 mb-6">
              Showing {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? "s" : ""}
            </p>

            {/* Product Grid */}
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <Card
                    key={product._id}
                    className="group overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-gradient-to-br from-[#ff8c6b]/20 to-[#ff8c6b]/30 flex items-center justify-center relative overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.images?.[0]?.alt || product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingBag className="h-12 w-12 text-[#ff8c6b]/30" />
                      )}
                      {!product.inStock && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                        </div>
                      )}
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-[#ff8c6b] text-white text-xs">Sale</Badge>
                        </div>
                      )}
                      {/* Quick Add Button */}
                      <button
                        onClick={() => addToCart(product)}
                        className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff8c6b] hover:text-white"
                        disabled={!product.inStock}
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-stone-900 text-sm sm:text-base mb-1 group-hover:text-[#ff8c6b] transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-bold text-[#ff8c6b]">
                            {formatPrice(product.price)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-xs sm:text-sm text-stone-400 line-through">
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => addToCart(product)}
                        className="w-full mt-3 bg-[#ff8c6b] hover:bg-[#e67854] text-white text-sm"
                        size="sm"
                        disabled={!product.inStock}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No products found.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setActiveCategory("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <Sidebar />
            <Button
              className="w-full mt-6 bg-[#ff8c6b] hover:bg-[#e67854]"
              onClick={() => setShowMobileFilters(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
