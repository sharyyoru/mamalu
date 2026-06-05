import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MONTHLY_CATEGORY_IDS = new Set(["monthly_mini", "monthly_big"]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category || !MONTHLY_CATEGORY_IDS.has(category)) {
      return NextResponse.json({ error: "Valid monthly category is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ dates: [] });
    }

    const { data, error } = await supabase
      .from("booking_slot_date_rules")
      .select("available_dates")
      .eq("category_id", category)
      .maybeSingle();

    if (error) {
      console.warn("Monthly date rules are not available yet:", error.message);
      return NextResponse.json({ dates: [] });
    }

    return NextResponse.json({ dates: Array.isArray(data?.available_dates) ? data.available_dates.sort() : [] });
  } catch (error) {
    console.error("Monthly dates error:", error);
    return NextResponse.json({ error: "Failed to load monthly dates" }, { status: 500 });
  }
}
