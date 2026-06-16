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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = createSanityAdminClient();
    const body = await request.json();
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const category = await client
      .patch(id)
      .set({
        title,
        slug: { _type: "slug", current: slugify(body.slug?.current || body.slug || title) },
        description: body.description || "",
        order: Number(body.order || 0),
        isActive: body.isActive !== false,
      })
      .commit();

    revalidatePath("/products");
    return NextResponse.json({ category });
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
    const client = createSanityAdminClient();
    await client.delete(id);

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
