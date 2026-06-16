import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSlug, fetchProductCategories, mapCategory, slugify } from "@/lib/products/catalog";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    const categories = await fetchProductCategories(supabase);
    return NextResponse.json({ categories: categories.map(mapCategory) });
  } catch (error: unknown) {
    console.error("Error fetching product categories:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to fetch product categories") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    const body = await request.json();
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from("product_categories")
      .insert({
        title,
        slug: slugify(currentSlug(body.slug) || title),
        description: body.description || "",
        display_order: Number(body.order || 0),
        is_active: body.isActive !== false,
        updated_at: new Date().toISOString(),
      })
      .select("id,title,slug,description,display_order,is_active")
      .single();

    if (error) throw error;

    revalidatePath("/products");
    return NextResponse.json({ category: mapCategory(category) });
  } catch (error: unknown) {
    console.error("Error creating product category:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create product category") },
      { status: 500 }
    );
  }
}
