import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Verify QR code and check in booking (for scanner redirect)
 * POST: Check in booking via API (for scanner app)
 * 
 * Supports both booking-level QR codes and individual guest QR codes
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

    // First, try to find a guest by QR token
    const { data: guest } = await supabase
      .from("booking_guests")
      .select(`
        *,
        booking:class_bookings(*)
      `)
      .eq("qr_code_token", token)
      .single();

    if (guest) {
      // Guest-level check-in
      return handleGuestCheckIn(supabase, guest, staffId, deviceInfo);
    }

    // Fall back to booking-level check-in (for single-guest bookings)
    const { data: booking, error: bookingError } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("qr_code_token", token)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid QR code - booking not found" 
      }, { status: 404 });
    }

    return handleBookingCheckIn(supabase, booking, staffId, deviceInfo);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ success: false, error: "Check-in failed" }, { status: 500 });
  }
}

async function handleGuestCheckIn(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  guest: any,
  staffId: string | null,
  deviceInfo: string | null
) {
  const booking = guest.booking;

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

  // Check if guest already checked in
  if (guest.checked_in_at) {
    return NextResponse.json({ 
      success: false, 
      error: "This guest has already checked in",
      alreadyCheckedIn: true,
      guest: {
        guestNumber: guest.guest_number,
        guestName: guest.guest_name || `Guest ${guest.guest_number}`,
        checkedInAt: guest.checked_in_at,
      },
      booking: {
        id: booking.id,
        bookingNumber: booking.booking_number,
        attendeeName: booking.attendee_name,
        classTitle: booking.class_title,
      }
    }, { status: 409 });
  }

  // Check in the guest
  const { error: guestUpdateError } = await supabase
    .from("booking_guests")
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: staffId || null,
    })
    .eq("id", guest.id);

  if (guestUpdateError) {
    console.error("Guest check-in error:", guestUpdateError);
    return NextResponse.json({ success: false, error: "Failed to check in guest" }, { status: 500 });
  }

  // Update booking's guests_checked_in count
  await supabase.rpc("increment_guests_checked_in", { booking_id: booking.id });

  // If all guests are checked in, mark the booking as checked in
  const { data: guestsData } = await supabase
    .from("booking_guests")
    .select("id, checked_in_at")
    .eq("booking_id", booking.id);

  const allGuestsCheckedIn = guestsData?.every(g => g.checked_in_at);
  
  if (allGuestsCheckedIn && !booking.checked_in_at) {
    await supabase
      .from("class_bookings")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: staffId || null,
      })
      .eq("id", booking.id);
  }

  // Log the check-in
  await supabase.from("booking_checkins").insert({
    booking_id: booking.id,
    guest_id: guest.id,
    checked_in_by: staffId || null,
    check_in_method: "qr_scan",
    device_info: deviceInfo || null,
  });

  const checkedInCount = (guestsData?.filter(g => g.checked_in_at).length || 0) + 1;
  const totalGuests = guestsData?.length || 1;

  return NextResponse.json({
    success: true,
    message: `Guest ${guest.guest_number} checked in!`,
    isGuestCheckIn: true,
    guest: {
      id: guest.id,
      guestNumber: guest.guest_number,
      guestName: guest.guest_name || `Guest ${guest.guest_number}`,
      checkedInAt: new Date().toISOString(),
    },
    booking: {
      id: booking.id,
      bookingNumber: booking.booking_number,
      attendeeName: booking.attendee_name,
      classTitle: booking.class_title,
      classId: booking.class_id,
      totalGuests,
      guestsCheckedIn: checkedInCount,
    }
  });
}

async function handleBookingCheckIn(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  booking: any,
  staffId: string | null,
  deviceInfo: string | null
) {
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

  // Perform check-in (for single-guest or legacy bookings)
  const numberOfGuests = booking.number_of_guests || 1;
  
  const { error: updateError } = await supabase
    .from("class_bookings")
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: staffId || null,
      guests_checked_in: numberOfGuests,
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
    message: numberOfGuests > 1 
      ? `Check-in successful! (${numberOfGuests} guests)` 
      : "Check-in successful!",
    booking: {
      id: booking.id,
      bookingNumber: booking.booking_number,
      attendeeName: booking.attendee_name,
      attendeeEmail: booking.attendee_email,
      classTitle: booking.class_title,
      classId: booking.class_id,
      totalGuests: numberOfGuests,
      guestsCheckedIn: numberOfGuests,
      checkedInAt: new Date().toISOString(),
    }
  });
}
