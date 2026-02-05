import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET lead bookings (manual entries)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { data, error } = await supabase
      .from("lead_bookings")
      .select("*")
      .eq("lead_id", id)
      .order("event_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bookings: data });
  } catch (error: any) {
    console.error("Error fetching lead bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST create manual booking for lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const body = await request.json();

    const { data, error } = await supabase
      .from("lead_bookings")
      .insert({
        lead_id: id,
        booking_type: body.booking_type || "other",
        description: body.description,
        event_date: body.event_date,
        amount: body.amount || 0,
        payment_status: body.payment_status || "paid",
        notes: body.notes,
        created_by: body.created_by,
      })
      .select()
      .single();

    if (error) throw error;

    // Update lead's total revenue
    const { data: allBookings } = await supabase
      .from("lead_bookings")
      .select("amount, payment_status")
      .eq("lead_id", id);

    const totalRevenue = (allBookings || [])
      .filter((b: any) => b.payment_status === "paid")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.amount) || 0), 0);

    await supabase
      .from("leads")
      .update({ total_revenue: totalRevenue, updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ booking: data });
  } catch (error: any) {
    console.error("Error creating lead booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

// DELETE a manual booking
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    // Get the lead_id before deleting
    const { data: booking } = await supabase
      .from("lead_bookings")
      .select("lead_id")
      .eq("id", bookingId)
      .single();

    const { error } = await supabase
      .from("lead_bookings")
      .delete()
      .eq("id", bookingId);

    if (error) throw error;

    // Update lead's total revenue
    if (booking?.lead_id) {
      const { data: allBookings } = await supabase
        .from("lead_bookings")
        .select("amount, payment_status")
        .eq("lead_id", booking.lead_id);

      const totalRevenue = (allBookings || [])
        .filter((b: any) => b.payment_status === "paid")
        .reduce((sum: number, b: any) => sum + (parseFloat(b.amount) || 0), 0);

      await supabase
        .from("leads")
        .update({ total_revenue: totalRevenue, updated_at: new Date().toISOString() })
        .eq("id", booking.lead_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete booking" },
      { status: 500 }
    );
  }
}
