import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data, error } = await supabase
      .from("vouchers")
      .select("id, discount_value, is_active")
      .eq("is_active", true)
      .order("discount_value", { ascending: true });

    if (error) throw error;

    // Group by amount
    const groups: Record<number, { amount: number; count: number }> = {};
    for (const v of data || []) {
      if (!groups[v.discount_value]) {
        groups[v.discount_value] = { amount: v.discount_value, count: 0 };
      }
      groups[v.discount_value].count++;
    }

    return NextResponse.json({ vouchers: Object.values(groups) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
