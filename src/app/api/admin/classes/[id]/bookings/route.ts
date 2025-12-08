import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch all bookings for a specific class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: bookings, error } = await supabase
      .from("class_bookings")
      .select(`
        *,
        user:profiles!user_id (
          id,
          email,
          full_name,
          phone,
          avatar_url,
          dietary_restrictions,
          dietary_notes,
          skill_level
        )
      `)
      .eq("class_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      total: bookings?.length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      pending: bookings?.filter(b => b.status === 'pending').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      completed: bookings?.filter(b => b.status === 'completed').length || 0,
      revenue: bookings?.filter(b => b.paid_at).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
    };

    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error("Error fetching class bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// PATCH: Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { bookingId, status } = body;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("class_bookings")
      .update({ status })
      .eq("id", bookingId)
      .eq("class_id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ booking: data });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
