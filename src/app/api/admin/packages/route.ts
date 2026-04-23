import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
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
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (category) {
      query = query.contains("categories", [category]);
    }
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const packages = (data || []).map((pkg) => ({
      ...pkg,
      menu_items: (pkg.package_menu_items || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((pmi: any) => pmi.menu_items)
        .filter(Boolean),
      package_menu_items: undefined,
    }));

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();
    const { menu_item_ids = [], ...packageFields } = body;

    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .insert({
        name: packageFields.name,
        description: packageFields.description || null,
        price: packageFields.price || 0,
        price_unit: packageFields.price_unit || "per person",
        categories: packageFields.categories || [],
        image_url: packageFields.image_url || null,
        emoji: packageFields.emoji || null,
        is_active: packageFields.is_active !== false,
        is_popular: packageFields.is_popular || false,
        sort_order: packageFields.sort_order || 0,
        metadata: packageFields.metadata || {},
      })
      .select()
      .single();

    if (pkgError) throw pkgError;

    if (menu_item_ids.length > 0) {
      const links = menu_item_ids.map((id: string, idx: number) => ({
        package_id: pkg.id,
        menu_item_id: id,
        sort_order: idx,
      }));
      const { error: linkError } = await supabase
        .from("package_menu_items")
        .insert(links);
      if (linkError) throw linkError;
    }

    return NextResponse.json({ package: pkg });
  } catch (error: any) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create package" },
      { status: 500 }
    );
  }
}
