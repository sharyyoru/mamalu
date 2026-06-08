import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomInt } from "crypto";

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateVoucherCode() {
  return Array.from({ length: 8 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ vouchers: data || [] });
  } catch (error: unknown) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();
    const quantity = Math.max(1, Math.floor(Number(body.quantity) || 1));

    if (quantity > 500) {
      return NextResponse.json({ error: "quantity cannot exceed 500" }, { status: 400 });
    }

    if ((quantity === 1 && !body.code) || !body.discount_type || body.discount_value === undefined) {
      return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
    }

    const { data: existingCodeRows, error: existingCodeError } = await supabase
      .from("vouchers")
      .select("code");

    if (existingCodeError) throw existingCodeError;

    const existingCodes = new Set(
      (existingCodeRows || [])
        .map((row: { code: string | null }) => row.code)
        .filter((code): code is string => Boolean(code))
    );

    const codes: string[] = [];
    if (quantity === 1) {
      codes.push(body.code.trim().toUpperCase());
    } else {
      while (codes.length < quantity) {
        const code = generateVoucherCode();
        if (!existingCodes.has(code) && !codes.includes(code)) {
          codes.push(code);
        }
      }
    }

    const duplicateCode = codes.find((code) => existingCodes.has(code));
    if (duplicateCode) {
      return NextResponse.json({ error: `Voucher code ${duplicateCode} already exists` }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("vouchers")
      .insert(codes.map((code) => ({
        code,
        description: body.description || null,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_order_value: body.min_order_value || null,
        max_uses: body.max_uses || 1,
        uses_count: 0,
        valid_from: body.valid_from || null,
        valid_until: body.valid_until || null,
        is_active: body.is_active !== false,
      })))
      .select()
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ voucher: data?.[0] || null, vouchers: data || [] });
  } catch (error: unknown) {
    console.error("Error creating voucher:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create voucher" },
      { status: 500 }
    );
  }
}
