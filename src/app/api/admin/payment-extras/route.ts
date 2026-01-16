import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

// GET: Fetch all payment extras
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = supabase
      .from("payment_extras")
      .select("*")
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: extras, error } = await query;

    if (error) {
      console.error("Fetch payment extras error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ extras: extras || [] });
  } catch (error) {
    console.error("Get payment extras error:", error);
    return NextResponse.json({ error: "Failed to fetch payment extras" }, { status: 500 });
  }
}

// POST: Create a new payment extra
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { name, description, price, isActive = true, sortOrder = 0 } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: extra, error } = await supabase
      .from("payment_extras")
      .insert({
        name,
        description: description || null,
        price: parseFloat(price),
        is_active: isActive,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Create payment extra error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, extra });
  } catch (error: any) {
    console.error("Create payment extra error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment extra" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing payment extra
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { id, name, description, price, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isActive !== undefined) updateData.is_active = isActive;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data: extra, error } = await supabase
      .from("payment_extras")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update payment extra error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, extra });
  } catch (error: any) {
    console.error("Update payment extra error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update payment extra" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a payment extra
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { error } = await supabase
      .from("payment_extras")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete payment extra error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete payment extra error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete payment extra" },
      { status: 500 }
    );
  }
}
