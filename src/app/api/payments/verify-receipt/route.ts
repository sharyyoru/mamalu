import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, verified, notes } = body;

    if (!bookingId || typeof verified !== "boolean") {
      return NextResponse.json(
        { error: "Booking ID and verification status are required" },
        { status: 400 }
      );
    }

    // Check if user is admin/staff
    const serverClient = await createClient();
    if (!serverClient) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }
    
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "staff", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.receipt_url) {
      return NextResponse.json(
        { error: "No receipt uploaded for this booking" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      receipt_verified: verified,
      receipt_verified_at: new Date().toISOString(),
      receipt_verified_by: user.id,
    };

    if (verified) {
      updateData.status = "confirmed";
      updateData.paid_at = new Date().toISOString();
    }

    if (notes) {
      updateData.notes = booking.notes
        ? `${booking.notes}\n\nVerification note: ${notes}`
        : `Verification note: ${notes}`;
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("class_bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to verify receipt" },
        { status: 500 }
      );
    }

    // Record transaction if verified
    if (verified) {
      await supabase.from("payment_transactions").insert({
        booking_id: bookingId,
        transaction_type: "payment",
        payment_method: "cash",
        amount: booking.total_amount,
        currency: "AED",
        status: "completed",
        receipt_url: booking.receipt_url,
        receipt_verified: true,
        processed_by: user.id,
        metadata: { notes },
      });
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: verified
        ? "Receipt verified and payment confirmed"
        : "Receipt rejected",
    });
  } catch (error) {
    console.error("Receipt verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify receipt" },
      { status: 500 }
    );
  }
}
