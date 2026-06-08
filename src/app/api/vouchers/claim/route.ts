import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRedeemableVoucherByCode } from "@/lib/vouchers/voucher-usage";

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

    const { voucher, error } = await getRedeemableVoucherByCode(supabase, code);
    if (!voucher) {
      return NextResponse.json(
        { error: error || "Invalid or expired voucher code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        amount: voucher.discount_value,
        expiresAt: voucher.expiresAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error claiming voucher:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to claim voucher" },
      { status: 500 }
    );
  }
}
