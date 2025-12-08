import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, enabled } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use admin client to update
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Verify the booking belongs to this user
    const { data: booking } = await adminClient
      .from("class_bookings")
      .select("id, user_id, attendee_email")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get user profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    // Check ownership
    if (booking.user_id !== user.id && booking.attendee_email !== profile?.email && booking.attendee_email !== user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update reminder status
    const { data: updatedBooking, error } = await adminClient
      .from("class_bookings")
      .update({ 
        reminder_enabled: enabled,
        reminder_updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      console.error("Update reminder error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message: enabled ? "Reminder enabled" : "Reminder disabled"
    });
  } catch (error) {
    console.error("Reminder update error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}
