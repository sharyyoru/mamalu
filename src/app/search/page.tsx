"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, ArrowRight, BookOpen, ShoppingBag, FileText, Calendar, Filter, X, Sparkles } from "lucide-react";
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
  class: "from-violet-500 to-purple-600",
  product: "from-emerald-500 to-teal-600",
  recipe: "from-amber-500 to-orange-600",
  blog: "from-blue-500 to-indigo-600",
};

const typeBgColors = {
  class: "bg-violet-100 text-violet-600",
  product: "bg-emerald-100 text-emerald-600",
  recipe: "bg-amber-100 text-amber-600",
  blog: "bg-blue-100 text-blue-600",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "all";
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(typeFilter);

  const filters = [
    { id: "all", label: "All Results" },
    { id: "class", label: "Classes" },
    { id: "product", label: "Products" },
    { id: "recipe", label: "Recipes" },
    { id: "blog", label: "Blogs" },
  ];

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeFilter}`);
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
    };

    fetchResults();
  }, [query, activeFilter]);

  const filteredResults = activeFilter === "all" 
    ? results 
    : results.filter(r => r.type === activeFilter);

  const resultCounts = {
    all: results.length,
    class: results.filter(r => r.type === "class").length,
    product: results.filter(r => r.type === "product").length,
    recipe: results.filter(r => r.type === "recipe").length,
    blog: results.filter(r => r.type === "blog").length,
  };

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-[#ff8c6b]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-[#ffa891]/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-peach text-[#ff8c6b] text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Search Results
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
              {query ? (
                <>
                  Results for <span className="text-gradient">&quot;{query}&quot;</span>
                </>
              ) : (
                "Search Mamalu Kitchen"
              )}
            </h1>
            <p className="text-lg text-stone-600">
              {isLoading ? "Searching..." : `Found ${filteredResults.length} result${filteredResults.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-2 shadow-xl">
              <div className="flex items-center gap-3 px-4">
                <Search className="h-5 w-5 text-[#ff8c6b]" />
                <input
                  type="text"
                  defaultValue={query}
                  placeholder="Search classes, products, recipes..."
                  className="flex-1 py-4 bg-transparent text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = (e.target as HTMLInputElement).value;
                      window.location.href = `/search?q=${encodeURIComponent(value)}${activeFilter !== "all" ? `&type=${activeFilter}` : ""}`;
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                  activeFilter === filter.id
                    ? "bg-gradient-to-r from-[#ff8c6b] to-[#ffa891] text-white shadow-lg shadow-[#ff8c6b]/25"
                    : "glass hover:bg-white/90 text-stone-600"
                )}
              >
                {filter.label}
                {resultCounts[filter.id as keyof typeof resultCounts] > 0 && (
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-xs",
                    activeFilter === filter.id ? "bg-white/20" : "bg-stone-100"
                  )}>
                    {resultCounts[filter.id as keyof typeof resultCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 text-[#ff8c6b] animate-spin mb-4" />
              <p className="text-stone-500">Searching...</p>
            </div>
          ) : !query ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ff8c6b]/20 to-[#ffa891]/10 flex items-center justify-center">
                <Search className="h-10 w-10 text-[#ff8c6b]" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Start your search</h2>
              <p className="text-stone-500">Type something to search for classes, products, recipes, and more</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                <Search className="h-10 w-10 text-stone-300" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">No results found</h2>
              <p className="text-stone-500 mb-6">Try a different search term or filter</p>
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#ff8c6b] to-[#ffa891] text-white font-semibold shadow-lg shadow-[#ff8c6b]/25 hover:shadow-xl transition-all"
              >
                Browse Classes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {filteredResults.map((result, index) => {
                const Icon = typeIcons[result.type];
                return (
                  <Link
                    key={result.id}
                    href={result.href}
                    className="group glass-card rounded-2xl p-4 sm:p-6 hover:shadow-xl transition-all card-hover"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {/* Image */}
                      <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
                        {result.image ? (
                          <Image
                            src={result.image}
                            alt={result.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", typeColors[result.type])}>
                            <Icon className="h-10 w-10 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-2", typeBgColors[result.type])}>
                              <Icon className="h-3 w-3" />
                              {typeLabels[result.type]}
                            </span>
                            <h3 className="text-xl font-bold text-stone-900 group-hover:text-[#ff8c6b] transition-colors">
                              {result.title}
                            </h3>
                          </div>
                          {result.price && (
                            <div className="text-right flex-shrink-0">
                              <span className="text-2xl font-bold text-gradient">AED {result.price}</span>
                            </div>
                          )}
                        </div>

                        {result.description && (
                          <p className="text-stone-600 line-clamp-2 mb-3">
                            {result.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-stone-500">
                            {result.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(result.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-[#ff8c6b] font-medium group-hover:gap-2 transition-all">
                            View Details
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-[#ff8c6b] animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
