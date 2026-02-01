import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get all service bookings with split payment info
    const { data: bookings, error } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("is_deposit_payment", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error: any) {
    console.error("Payment tracking error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
