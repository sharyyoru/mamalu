import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data, error } = await supabase
      .from("packages")
      .select(`
        *,
        package_menu_items (
          id,
          sort_order,
          menu_item_id,
          menu_items (
            id,
            name,
            description,
            price,
            price_unit,
            categories,
            image_url,
            emoji
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    const pkg = {
      ...data,
      menu_items: (data.package_menu_items || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((pmi: any) => pmi.menu_items)
        .filter(Boolean),
      package_menu_items: undefined,
    };

    return NextResponse.json({ package: pkg });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Not found" },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();
    const { menu_item_ids, ...packageFields } = body;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const fields = [
      "name", "description", "price", "price_unit", "categories",
      "image_url", "emoji", "is_active", "is_popular", "sort_order", "metadata",
    ];
    for (const f of fields) {
      if (f in packageFields) updateData[f] = packageFields[f];
    }

    const { data, error } = await supabase
      .from("packages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (menu_item_ids !== undefined) {
      await supabase.from("package_menu_items").delete().eq("package_id", id);

      if (menu_item_ids.length > 0) {
        const links = menu_item_ids.map((itemId: string, idx: number) => ({
          package_id: id,
          menu_item_id: itemId,
          sort_order: idx,
        }));
        const { error: linkError } = await supabase
          .from("package_menu_items")
          .insert(links);
        if (linkError) throw linkError;
      }
    }

    return NextResponse.json({ package: data });
  } catch (error: any) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update package" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete package" },
      { status: 500 }
    );
  }
}
