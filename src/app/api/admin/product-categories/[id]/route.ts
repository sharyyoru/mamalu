import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSlug, mapCategory, slugify } from "@/lib/products/catalog";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from("product_categories")
      .update({
        title,
        slug: slugify(currentSlug(body.slug) || title),
        description: body.description || "",
        display_order: Number(body.order || 0),
        is_active: body.isActive !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,title,slug,description,display_order,is_active")
      .single();

    if (error) throw error;

    revalidatePath("/products");
    return NextResponse.json({ category: mapCategory(category) });
  } catch (error: unknown) {
    console.error("Error updating product category:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to update product category") },
      { status: 500 }
    );
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

    const { error } = await supabase.from("product_categories").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/products");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting product category:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to delete product category") },
      { status: 500 }
    );
  }
}
