import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BOOKING_TABLES = ["service_bookings", "class_bookings"] as const;
type BookingTable = (typeof BOOKING_TABLES)[number];
type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

async function findBookingTable(supabase: AdminClient, id: string): Promise<BookingTable | null> {
  for (const table of BOOKING_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Find booking in ${table} failed:`, error);
      continue;
    }

    if (data) {
      return table;
    }
  }

  return null;
}

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

    const table = await findBookingTable(supabase, id);
    if (!table) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: booking, error } = await supabase
      .from(table)
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

    const table = await findBookingTable(supabase, id);
    if (!table) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
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
        .from(table)
        .select("notes")
        .eq("id", id)
        .maybeSingle();
      
      updateData.notes = currentBooking?.notes
        ? `${currentBooking.notes}\n\n${notes}`
        : notes;
    }

    if (paid_at !== undefined) {
      updateData.paid_at = paid_at;
    }

    const { data: bookings, error } = await supabase
      .from(table)
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (bookings.length > 1) {
      return NextResponse.json({ error: "Multiple bookings matched this update" }, { status: 500 });
    }

    const booking = bookings[0];

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

    const table = await findBookingTable(supabase, id);
    if (!table) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Soft delete by setting status to cancelled
    const { data: booking, error } = await supabase
      .from(table)
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
