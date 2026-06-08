import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAvailableVouchersForAmount } from "@/lib/vouchers/assign-purchase-voucher";

export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data, error } = await supabase
      .from("vouchers")
      .select("discount_value")
      .eq("is_active", true)
      .order("discount_value", { ascending: true });

    if (error) throw error;

    const amounts = Array.from(new Set((data || []).map((voucher) => Number(voucher.discount_value))));
    const groups: Array<{ amount: number; count: number }> = [];
    for (const amount of amounts) {
      const available = await listAvailableVouchersForAmount(supabase, amount);
      if (available.length > 0) {
        groups.push({ amount, count: available.length });
      }
    }

    return NextResponse.json({ vouchers: groups });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}
