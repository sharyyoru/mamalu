import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("voucher_purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all" && status !== "claimed") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get list of claimed voucher codes from voucher_redemptions
    const { data: redemptions } = await supabase
      .from("voucher_redemptions")
      .select("voucher_code");
    
    const claimedCodes = new Set(redemptions?.map((r: any) => r.voucher_code) || []);

    // Add is_claimed flag to each purchase
    const purchasesWithClaimed = (data || []).map((p: any) => ({
      ...p,
      is_claimed: p.voucher_code ? claimedCodes.has(p.voucher_code) : false,
    }));

    // Filter by claimed status if requested
    let filteredPurchases = purchasesWithClaimed;
    if (status === "claimed") {
      filteredPurchases = purchasesWithClaimed.filter((p: any) => p.is_claimed);
    }

    return NextResponse.json({ purchases: filteredPurchases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
