import { Metadata } from "next";
import { getProducts, getProductCategories } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";
import ProductsClient from "./ProductsClient";

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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Our Products
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Premium ingredients and kitchenware to elevate your cooking
              experience.
            </p>
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
