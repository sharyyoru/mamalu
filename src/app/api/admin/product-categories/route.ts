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

export async function GET() {
  try {
    const client = createSanityAdminClient();
    const categories = await client.fetch(`
      *[_type == "productCategory"] | order(order asc, title asc) {
        _id,
        title,
        slug,
        description,
        order,
        isActive
      }
    `);

    return NextResponse.json({ categories });
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
    const client = createSanityAdminClient();
    const body = await request.json();
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const category = await client.create({
      _type: "productCategory",
      title,
      slug: { _type: "slug", current: slugify(body.slug?.current || body.slug || title) },
      description: body.description || "",
      order: Number(body.order || 0),
      isActive: body.isActive !== false,
    });

    revalidatePath("/products");
    return NextResponse.json({ category });
  } catch (error: unknown) {
    console.error("Error creating product category:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create product category") },
      { status: 500 }
    );
  }
}
