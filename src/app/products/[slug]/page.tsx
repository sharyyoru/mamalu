import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getProductBySlug } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";
import Image from "next/image";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface ProductPageData {
  _id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images?: { asset: { _ref: string }; alt?: string }[];
  categories?: { _id: string; title: string }[];
  inStock: boolean;
  body?: string;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug) as ProductPageData | null;

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
  const product = await getProductBySlug(slug) as ProductPageData | null;

  if (!product) {
    notFound();
  }

  const image = product.images?.[0];
  const imageUrl = image ? urlFor(image).width(900).height(900).url() : null;
  const body = product.body || product.description;

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
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-[#FF8C6B]/20">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={image?.alt || product.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, calc(100vw - 2rem)"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-32 w-32 text-amber-600/30" />
                </div>
              )}
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
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="ml-3 text-base text-stone-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              {product.inStock ? (
                <Badge variant="success" className="mb-6">In Stock</Badge>
              ) : (
                <Badge variant="destructive" className="mb-6">Out of Stock</Badge>
              )}

              {/* Description */}
              <div className="mt-8 pt-8 border-t border-stone-200">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">
                  About this product
                </h2>
                <div className="prose prose-stone">
                  {body.split("\n\n").map((paragraph, idx) => (
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
