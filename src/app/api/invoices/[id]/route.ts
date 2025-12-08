import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch single invoice
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

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, booking:booking_id(*)")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// PATCH: Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, dueDate, cancelled_reason } = body;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      
      if (status === "sent") {
        updateData.sent_at = new Date().toISOString();
      } else if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
        if (cancelled_reason) {
          updateData.notes = cancelled_reason;
        }
      }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (dueDate !== undefined) updateData.due_date = dueDate;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If marking as paid, update linked booking
    if (status === "paid" && invoice.booking_id) {
      await supabase
        .from("class_bookings")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoice.booking_id);
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE: Delete invoice
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

    // Check if invoice exists and is not paid
    const { data: invoice } = await supabase
      .from("invoices")
      .select("status, booking_id")
      .eq("id", id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Cannot delete a paid invoice" },
        { status: 400 }
      );
    }

    // Remove invoice link from booking if exists
    if (invoice.booking_id) {
      await supabase
        .from("class_bookings")
        .update({
          invoice_number: null,
          invoice_url: null,
          payment_link: null,
        })
        .eq("id", invoice.booking_id);
    }

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
