import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSlug, slugify } from "@/lib/products/catalog";

type ProductRequestBody = {
  title?: string;
  slug?: string | { current?: string };
  description?: string;
  price?: number | string;
  compareAtPrice?: number | string | null;
  imageUrl?: string;
  categoryIds?: string[];
  tags?: string[] | string;
  inStock?: boolean;
  isActive?: boolean;
  stockQuantity?: number | string | null;
  sku?: string;
  weight?: number | string | null;
  featured?: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function productPayload(body: ProductRequestBody) {
  const title = String(body.title || "").trim();

  if (!title) {
    throw new Error("Title is required");
  }

  return {
    title,
    slug: slugify(currentSlug(body.slug) || title),
    description: body.description || "",
    price: Number(body.price || 0),
    compare_at_price:
      body.compareAtPrice === "" || body.compareAtPrice == null
        ? null
        : Number(body.compareAtPrice),
    image_url: body.imageUrl || "",
    category_ids: Array.isArray(body.categoryIds) ? body.categoryIds : [],
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    in_stock: body.inStock !== false,
    is_active: body.isActive !== false,
    stock_quantity:
      body.stockQuantity === "" || body.stockQuantity == null
        ? null
        : Number(body.stockQuantity),
    sku: body.sku || "",
    weight: body.weight === "" || body.weight == null ? null : Number(body.weight),
    featured: Boolean(body.featured),
    updated_at: new Date().toISOString(),
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    const body = await request.json();
    const payload = productPayload(body);
    const { data: product, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    revalidatePath("/products");
    revalidatePath(`/products/${product.slug || ""}`);
    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    const message = getErrorMessage(error, "Failed to update product");
    return NextResponse.json({ error: message }, { status: message === "Title is required" ? 400 : 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/products");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to delete product") },
      { status: 500 }
    );
  }
}
