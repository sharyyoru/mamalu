import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Verify QR code and check in booking (for scanner redirect)
 * POST: Check in booking via API (for scanner app)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/admin/scanner?error=invalid", request.url));
  }

  // Redirect to scanner page with token for processing
  return NextResponse.redirect(new URL(`/admin/scanner?token=${token}`, request.url));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, staffId, deviceInfo } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    // Find booking by QR token
    const { data: booking, error: bookingError } = await supabase
      .from("class_bookings")
      .select(`
        *,
        profile:profiles(full_name, email, phone)
      `)
      .eq("qr_code_token", token)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid QR code - booking not found" 
      }, { status: 404 });
    }

    // Check if booking is confirmed/paid
    if (booking.status !== "confirmed") {
      return NextResponse.json({ 
        success: false, 
        error: `Booking is ${booking.status}. Only confirmed bookings can be checked in.`,
        booking: {
          bookingNumber: booking.booking_number,
          status: booking.status,
          attendeeName: booking.attendee_name,
        }
      }, { status: 400 });
    }

    // Check if already checked in
    if (booking.checked_in_at) {
      return NextResponse.json({ 
        success: false, 
        error: "Already checked in",
        alreadyCheckedIn: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.booking_number,
          attendeeName: booking.attendee_name,
          classTitle: booking.class_title,
          checkedInAt: booking.checked_in_at,
        }
      }, { status: 409 });
    }

    // Perform check-in
    const { error: updateError } = await supabase
      .from("class_bookings")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: staffId || null,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Check-in update error:", updateError);
      return NextResponse.json({ success: false, error: "Failed to check in" }, { status: 500 });
    }

    // Log the check-in
    await supabase.from("booking_checkins").insert({
      booking_id: booking.id,
      checked_in_by: staffId || null,
      check_in_method: "qr_scan",
      device_info: deviceInfo || null,
    });

    return NextResponse.json({
      success: true,
      message: "Check-in successful!",
      booking: {
        id: booking.id,
        bookingNumber: booking.booking_number,
        attendeeName: booking.attendee_name,
        attendeeEmail: booking.attendee_email,
        classTitle: booking.class_title,
        classId: booking.class_id,
        sessionsBooked: booking.sessions_booked,
        checkedInAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ success: false, error: "Check-in failed" }, { status: 500 });
  }
}
