"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, ArrowRight, BookOpen, ShoppingBag, FileText, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: "class" | "product" | "recipe" | "blog";
  href: string;
  image?: string;
  price?: number;
  date?: string;
}

const typeIcons = {
  class: BookOpen,
  product: ShoppingBag,
  recipe: FileText,
  blog: FileText,
};

const typeLabels = {
  class: "Class",
  product: "Product",
  recipe: "Recipe",
  blog: "Blog",
};

const typeColors = {
  class: "bg-violet-100 text-violet-600",
  product: "bg-emerald-100 text-emerald-600",
  recipe: "bg-amber-100 text-amber-600",
  blog: "bg-blue-100 text-blue-600",
};

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filters = [
    { id: "all", label: "All" },
    { id: "class", label: "Classes" },
    { id: "product", label: "Products" },
    { id: "recipe", label: "Recipes" },
    { id: "blog", label: "Blogs" },
  ];

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeFilter}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, performSearch]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredResults = activeFilter === "all" 
    ? results 
    : results.filter(r => r.type === activeFilter);

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full glass hover:bg-white/90 transition-all group"
      >
        <Search className="h-4 w-4 text-stone-500 group-hover:text-[#ff8c6b] transition-colors" />
        <span className="text-sm text-stone-500 hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-stone-400 bg-stone-100 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
          />
          
          {/* Search Container */}
          <div 
            ref={containerRef}
            className="relative w-full max-w-2xl glass-card rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Search Header */}
            <div className="relative border-b border-stone-200/50">
              <div className="flex items-center px-6 py-4">
                <Search className="h-5 w-5 text-[#ff8c6b] mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search classes, products, recipes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none"
                />
                {isLoading && <Loader2 className="h-5 w-5 text-[#ff8c6b] animate-spin mr-2" />}
                {query && !isLoading && (
                  <button
                    onClick={() => setQuery("")}
                    className="p-1 hover:bg-stone-100 rounded-full transition-colors mr-2"
                  >
                    <X className="h-4 w-4 text-stone-500" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 px-6 pb-3 overflow-x-auto">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                      activeFilter === filter.id
                        ? "bg-[#ff8c6b] text-white shadow-md"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#ff8c6b]/20 to-[#ffa891]/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-[#ff8c6b]" />
                  </div>
                  <p className="text-stone-600 font-medium">Start typing to search</p>
                  <p className="text-sm text-stone-400 mt-1">Find classes, products, recipes, and more</p>
                </div>
              ) : filteredResults.length === 0 && !isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                    <Search className="h-8 w-8 text-stone-300" />
                  </div>
                  <p className="text-stone-600 font-medium">No results found</p>
                  <p className="text-sm text-stone-400 mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="p-4">
                  {Object.entries(groupedResults).map(([type, items]) => (
                    <div key={type} className="mb-6 last:mb-0">
                      <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-2">
                        {typeLabels[type as keyof typeof typeLabels]}s
                      </h3>
                      <div className="space-y-1">
                        {items.slice(0, 5).map((result) => {
                          const Icon = typeIcons[result.type];
                          return (
                            <Link
                              key={result.id}
                              href={result.href}
                              onClick={() => {
                                setIsOpen(false);
                                setQuery("");
                              }}
                              className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#ff8c6b]/5 transition-all group"
                            >
                              {/* Image/Icon */}
                              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                                {result.image ? (
                                  <Image
                                    src={result.image}
                                    alt={result.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className={cn("w-full h-full flex items-center justify-center", typeColors[result.type])}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-stone-900 truncate group-hover:text-[#ff8c6b] transition-colors">
                                    {result.title}
                                  </h4>
                                  <span className={cn("text-xs px-2 py-0.5 rounded-full", typeColors[result.type])}>
                                    {typeLabels[result.type]}
                                  </span>
                                </div>
                                {result.description && (
                                  <p className="text-sm text-stone-500 truncate mt-0.5">
                                    {result.description}
                                  </p>
                                )}
                                {result.date && (
                                  <div className="flex items-center gap-1 text-xs text-stone-400 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {result.date}
                                  </div>
                                )}
                              </div>
                              
                              {/* Price or Arrow */}
                              <div className="flex-shrink-0">
                                {result.price ? (
                                  <span className="text-sm font-bold text-[#ff8c6b]">
                                    AED {result.price}
                                  </span>
                                ) : (
                                  <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-[#ff8c6b] transition-colors" />
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* View All Results */}
                  {filteredResults.length > 0 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}${activeFilter !== "all" ? `&type=${activeFilter}` : ""}`}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center justify-center gap-2 p-3 mt-4 rounded-xl bg-stone-50 hover:bg-[#ff8c6b]/10 text-stone-600 hover:text-[#ff8c6b] transition-all font-medium"
                    >
                      View all {filteredResults.length} results
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
