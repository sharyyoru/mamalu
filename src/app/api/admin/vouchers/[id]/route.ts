import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ voucher: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Not found" },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const fields = [
      "code", "description", "discount_type", "discount_value",
      "min_order_value", "max_uses", "valid_from", "valid_until", "is_active",
    ];
    for (const f of fields) {
      if (f in body) {
        updateData[f] = f === "code" && body[f] ? body[f].trim().toUpperCase() : body[f];
      }
    }

    const { data, error } = await supabase
      .from("vouchers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ voucher: data });
  } catch (error: any) {
    console.error("Error updating voucher:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update voucher" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { error } = await supabase
      .from("vouchers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete voucher" },
      { status: 500 }
    );
  }
}
