import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: Send invoice (mark as sent and optionally trigger email)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot send a cancelled invoice" },
        { status: 400 }
      );
    }

    // Update invoice status to sent
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update linked booking if exists
    if (invoice.booking_id) {
      await supabase
        .from("class_bookings")
        .update({
          invoice_sent_at: new Date().toISOString(),
        })
        .eq("id", invoice.booking_id);
    }

    // TODO: Send email notification with payment link
    // This could be integrated with a service like SendGrid, Resend, etc.
    // For now, we'll just mark it as sent and the staff can manually share the link

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      paymentLink: invoice.payment_link,
      message: `Invoice sent. Payment link: ${invoice.payment_link}`,
    });
  } catch (error) {
    console.error("Send invoice error:", error);
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
}
