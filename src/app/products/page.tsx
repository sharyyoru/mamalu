import { Metadata } from "next";
import { getProducts, getProductCategories } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";
import ProductsClient from "./ProductsClient";
import { Sparkles, ShoppingBag, Truck, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Shop premium ingredients and kitchenware from Mamalu Kitchen.",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ]);

  // Pre-process image URLs on the server
  const productsWithImages = (products || []).map((product: any) => ({
    ...product,
    imageUrl: product.images?.[0] 
      ? urlFor(product.images[0]).width(400).height(400).url() 
      : null,
  }));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative gradient-mesh py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-[#ff8c6b]/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass-peach text-[#ff8c6b] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Premium Quality
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Shop <span className="text-gradient">Products</span>
            </h1>
            <p className="text-lg lg:text-xl text-stone-600 max-w-2xl mx-auto">
              Premium ingredients and kitchenware to elevate your cooking experience
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-2">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-stone-900">Quality Products</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-[#ff8c6b] to-[#ffa891] flex items-center justify-center mb-2">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-stone-900">Fast Delivery</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-stone-900">Secure Payment</div>
            </div>
          </div>
        </div>
      </section>

      <ProductsClient
        products={productsWithImages}
        categories={categories || []}
      />
    </div>
  );
}
