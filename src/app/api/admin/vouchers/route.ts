import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  } catch (error: any) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();

    if (!body.code || !body.discount_type || body.discount_value === undefined) {
      return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vouchers")
      .insert({
        code: body.code.trim().toUpperCase(),
        description: body.description || null,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_order_value: body.min_order_value || null,
        max_uses: body.max_uses || null,
        valid_from: body.valid_from || null,
        valid_until: body.valid_until || null,
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ voucher: data });
  } catch (error: any) {
    console.error("Error creating voucher:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voucher" },
      { status: 500 }
    );
  }
}
