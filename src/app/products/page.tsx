import { Metadata } from "next";
import { getProducts, getProductCategories } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";
import ProductsClient from "./ProductsClient";
import type { Product } from "./ProductsClient";
import { ShoppingBag, Truck, Shield } from "lucide-react";
import Image from "next/image";

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
  const productsWithImages = ((products || []) as Product[]).map((product) => {
    const image = product.images?.[0];

    return {
      ...product,
      imageUrl: image ? urlFor(image).width(400).height(400).url() : null,
      previewImageUrl: image ? urlFor(image).width(900).height(900).url() : null,
    };
  });

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Decorative margin images */}
      <div className="pointer-events-none hidden xl:block">
        <Image src="/images/image-random/knives-01.png" alt="" width={100} height={100} className="absolute left-4 top-40 opacity-60" style={{ transform: "rotate(-10deg)" }} />
        <Image src="/images/image-random/grill.png" alt="" width={115} height={115} className="absolute right-4 top-32 opacity-55" style={{ transform: "rotate(12deg)" }} />
        <Image src="/images/image-random/pot big-01.png" alt="" width={105} height={105} className="absolute right-6 top-[55%] opacity-50" style={{ transform: "rotate(-8deg)" }} />
      </div>
      {/* Hero */}
      <section className="relative gradient-mesh py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-stone-300/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-[#ff7f5c]/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center relative">
            <div className="flex items-center justify-center gap-4 lg:gap-8">
              <div className="hidden lg:block">
                <Image src="/images/0312b1_27732e4abccb4925bca29ff7f349d958~mv2_d_1772_1772_s_2.avif" alt="" width={200} height={200} className="opacity-70" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
                Eazy Freezy
              </h1>
              <div className="hidden lg:block">
                <Image src="/images/0312b1_fee52e9b65c54277bd129615e50d68ff~mv2_d_1772_1772_s_2.avif" alt="" width={190} height={190} className="opacity-70" />
              </div>
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
