import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PublicMenuItem {
  categories: string[] | null;
}

// GET active menu items (public endpoint for frontend)
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("menu_items")
      .select("id, categories, name, description, dishes, price, price_unit, image_url, emoji, is_popular, sort_order, min_guests, max_guests, scheduled_date, metadata")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (category) {
      query = query.contains("categories", [category]);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by category
    const grouped: Record<string, PublicMenuItem[]> = {};
    ((data || []) as PublicMenuItem[]).forEach((item) => {
      for (const cat of item.categories || []) {
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      }
    });

    return NextResponse.json({ items: data || [], grouped });
  } catch (error: unknown) {
    console.error("Error fetching menus:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch menus";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
