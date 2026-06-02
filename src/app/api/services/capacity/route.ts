import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/services/capacity?menuId=xxx
// Returns allowed_persons, booked_count and available spots for a menu item.
// All bookings except cancelled ones count toward the total.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("menuId");

    if (!menuId) {
      return NextResponse.json({ error: "menuId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    // Get allowed_persons from menu_items
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .select("id, allowed_persons")
      .eq("id", menuId)
      .single();

    if (menuError || !menuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // If no allowed_persons set, capacity is unlimited
    if (menuItem.allowed_persons === null || menuItem.allowed_persons === undefined) {
      return NextResponse.json({
        menuId,
        allowed_persons: null,
        booked_count: 0,
        available: null,
        is_unlimited: true,
        is_full: false,
      });
    }

    // Count all non-cancelled bookings for this menu item
    const { count, error: countError } = await supabase
      .from("service_bookings")
      .select("id", { count: "exact", head: true })
      .eq("menu_id", menuId)
      .neq("status", "cancelled");

    if (countError) throw countError;

    const booked = count || 0;
    const available = Math.max(0, menuItem.allowed_persons - booked);

    return NextResponse.json({
      menuId,
      allowed_persons: menuItem.allowed_persons,
      booked_count: booked,
      available,
      is_unlimited: false,
      is_full: available <= 0,
    });
  } catch (error: any) {
    console.error("Capacity check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check capacity" },
      { status: 500 }
    );
  }
}
