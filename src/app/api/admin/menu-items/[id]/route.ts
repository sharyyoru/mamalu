import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET single menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// PUT update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();

    const { data, error } = await supabase
      .from("menu_items")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
