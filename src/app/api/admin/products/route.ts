import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSanityAdminClient } from "@/lib/sanity/admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createKey() {
  return Math.random().toString(36).slice(2, 12);
}

interface ProductRequestBody {
  title?: string;
  slug?: string | { current?: string };
  description?: string;
  body?: unknown[];
  price?: number | string;
  compareAtPrice?: number | string | null;
  images?: unknown[];
  categoryIds?: string[];
  tags?: string[] | string;
  inStock?: boolean;
  isActive?: boolean;
  stockQuantity?: number | string | null;
  sku?: string;
  weight?: number | string | null;
  featured?: boolean;
}

function categoryRefs(categoryIds: string[] = []) {
  return categoryIds.map((id) => ({
    _key: createKey(),
    _type: "reference",
    _ref: id,
  }));
}

function slugValue(slug: ProductRequestBody["slug"]) {
  if (typeof slug === "string") return slug;
  return slug?.current || "";
}

function productPayload(body: ProductRequestBody) {
  const title = String(body.title || "").trim();
  const images = Array.isArray(body.images) ? body.images : [];

  if (!title) {
    throw new Error("Title is required");
  }

  return {
    title,
    slug: { _type: "slug", current: slugify(slugValue(body.slug) || title) },
    description: body.description || "",
    body: Array.isArray(body.body) ? body.body : [],
    price: Number(body.price || 0),
    compareAtPrice:
      body.compareAtPrice === "" || body.compareAtPrice == null
        ? undefined
        : Number(body.compareAtPrice),
    images,
    categories: categoryRefs(body.categoryIds || []),
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    inStock: body.inStock !== false,
    isActive: body.isActive !== false,
    stockQuantity:
      body.stockQuantity === "" || body.stockQuantity == null
        ? undefined
        : Number(body.stockQuantity),
    sku: body.sku || "",
    weight: body.weight === "" || body.weight == null ? undefined : Number(body.weight),
    featured: Boolean(body.featured),
  };
}

export async function GET() {
  try {
    const client = createSanityAdminClient();
    const [products, categories] = await Promise.all([
      client.fetch(`
        *[_type == "product"] | order(_createdAt desc) {
          _id,
          _createdAt,
          title,
          slug,
          description,
          price,
          compareAtPrice,
          images,
          "imageUrl": images[0].asset->url,
          categories[]->{_id, title, slug},
          tags,
          inStock,
          isActive,
          stockQuantity,
          sku,
          weight,
          featured
        }
      `),
      client.fetch(`
        *[_type == "productCategory"] | order(order asc, title asc) {
          _id,
          title,
          slug,
          description,
          order
        }
      `),
    ]);

    return NextResponse.json({ products, categories });
  } catch (error: unknown) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = createSanityAdminClient();
    const body = await request.json();
    const product = await client.create({
      _type: "product",
      ...productPayload(body),
    });

    revalidatePath("/products");
    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    const status = message === "Title is required" ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
