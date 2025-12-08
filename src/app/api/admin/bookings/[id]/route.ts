import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch single booking
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

    const { data: booking, error } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

// PATCH: Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, paid_at, refund_amount, refund_reason } = body;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      
      // If confirming, check if we should also mark as paid
      if (status === "confirmed" && body.markAsPaid) {
        updateData.paid_at = new Date().toISOString();
      }
      
      // If cancelling, handle refund info if provided
      if (status === "cancelled") {
        if (refund_amount) updateData.refund_amount = refund_amount;
        if (refund_reason) updateData.refund_reason = refund_reason;
        updateData.refunded_at = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      // Fetch current notes and append
      const { data: currentBooking } = await supabase
        .from("class_bookings")
        .select("notes")
        .eq("id", id)
        .single();
      
      updateData.notes = currentBooking?.notes
        ? `${currentBooking.notes}\n\n${notes}`
        : notes;
    }

    if (paid_at !== undefined) {
      updateData.paid_at = paid_at;
    }

    const { data: booking, error } = await supabase
      .from("class_bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

// DELETE: Cancel/delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Soft delete by setting status to cancelled
    const { data: booking, error } = await supabase
      .from("class_bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ booking, message: "Booking cancelled" });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
