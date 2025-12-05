"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Filter, ArrowRight } from "lucide-react";
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

export default function ProductsClient({
  products,
  categories,
}: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const allCategories = [
    { _id: "all", title: "All Products", slug: { current: "all" } },
    ...categories,
  ];

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) =>
          p.categories?.some((c) => c.slug.current === activeCategory)
        );

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Filter className="h-5 w-5 text-stone-400 mr-2 self-center" />
          {allCategories.map((category) => (
            <Button
              key={category._id}
              variant={
                activeCategory === category.slug.current ? "default" : "outline"
              }
              size="sm"
              onClick={() => setActiveCategory(category.slug.current)}
            >
              {category.title}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product._id}
                className="group overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.images?.[0]?.alt || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag className="h-12 w-12 text-amber-600/30" />
                  )}
                  {!product.inStock && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="success">Sale</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.categories?.slice(0, 2).map((cat) => (
                      <Badge key={cat._id} variant="secondary" className="text-xs">
                        {cat.title}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-1 group-hover:text-amber-600 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-sm text-stone-500 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-600">
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-sm text-stone-400 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/products/${product.slug.current}`}
                      className="text-sm font-medium text-stone-600 hover:text-amber-600"
                    >
                      View
                      <ArrowRight className="h-3 w-3 inline ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No products in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
