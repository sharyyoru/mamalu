import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("discount_codes")
      .select(`
        *,
        usage:discount_usage(count)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ discounts: data || [] });
  } catch (error: any) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      code,
      description,
      type,
      value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      usage_per_customer,
      valid_from,
      valid_until,
      applies_to,
      applies_to_ids,
      customer_segments,
      first_order_only,
    } = body;

    // Generate code if not provided
    const discountCode = code || generateDiscountCode();

    const { data, error } = await supabase
      .from("discount_codes")
      .insert({
        code: discountCode.toUpperCase(),
        description,
        type: type || "percent",
        value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        first_order_only: first_order_only || false,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ discount: data });
  } catch (error: any) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Discount ID required" }, { status: 400 });
    }

    // Ensure code is uppercase if provided
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ discount: data });
  } catch (error: any) {
    console.error("Error updating discount:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Discount ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("discount_codes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting discount:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateDiscountCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
