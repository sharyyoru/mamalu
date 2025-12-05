import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
// import { getProductBySlug } from "@/lib/sanity/queries";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Placeholder data
const productsData: Record<string, {
  _id: string;
  title: string;
  description: string;
  price: number;
  categories: { _id: string; title: string }[];
  inStock: boolean;
  body: string;
}> = {
  "premium-zaatar-blend": {
    _id: "1",
    title: "Premium Za'atar Blend",
    description: "A traditional blend of thyme, sumac, and sesame seeds.",
    price: 45,
    categories: [{ _id: "1", title: "Spices" }],
    inStock: true,
    body: "Our Premium Za'atar is a carefully curated blend of wild thyme, tangy sumac, and toasted sesame seeds. Sourced from the finest producers in the Levant region, this aromatic spice blend is perfect for seasoning meats, sprinkling over flatbreads with olive oil, or adding depth to your favorite hummus.\n\nEach batch is hand-blended in small quantities to ensure freshness and optimal flavor. The wild thyme provides an earthy, herbaceous base, while the sumac adds a citrusy tang that perfectly complements the nutty richness of toasted sesame seeds.",
  },
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = productsData[slug];

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.title,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = productsData[slug];

  if (!product) {
    notFound();
  }

  return (
    <div>
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild href="/products" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-32 w-32 text-amber-600/30" />
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {product.categories?.map((cat) => (
                  <Badge key={cat._id} variant="secondary">
                    {cat.title}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                {product.title}
              </h1>
              <p className="text-lg text-stone-600 mb-6">
                {product.description}
              </p>
              <div className="text-3xl font-bold text-amber-600 mb-6">
                {formatPrice(product.price)}
              </div>

              {/* Stock Status */}
              {product.inStock ? (
                <Badge variant="success" className="mb-6">In Stock</Badge>
              ) : (
                <Badge variant="destructive" className="mb-6">Out of Stock</Badge>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-stone-700">
                  Quantity:
                </span>
                <div className="flex items-center border border-stone-300 rounded-md">
                  <button className="p-2 hover:bg-stone-100">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">1</span>
                  <button className="p-2 hover:bg-stone-100">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button
                size="lg"
                className="w-full sm:w-auto"
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>

              {/* Description */}
              <div className="mt-8 pt-8 border-t border-stone-200">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">
                  About this product
                </h2>
                <div className="prose prose-stone">
                  {product.body.split("\n\n").map((paragraph, idx) => (
                    <p key={idx} className="text-stone-600">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
