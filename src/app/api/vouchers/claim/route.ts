import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Voucher code is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .select("id, code, discount_value, is_active")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !voucher) {
      return NextResponse.json(
        { error: "Invalid or expired voucher code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        amount: voucher.discount_value,
      },
    });
  } catch (error: any) {
    console.error("Error claiming voucher:", error);
    return NextResponse.json(
      { error: error.message || "Failed to claim voucher" },
      { status: 500 }
    );
  }
}
