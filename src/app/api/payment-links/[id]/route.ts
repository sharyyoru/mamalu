import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch single payment link
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

    const { data: paymentLink, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !paymentLink) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    return NextResponse.json({ paymentLink });
  } catch (error) {
    console.error("Get payment link error:", error);
    return NextResponse.json({ error: "Failed to fetch payment link" }, { status: 500 });
  }
}

// PATCH: Update payment link
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch current payment link
    const { data: currentLink, error: fetchError } = await supabase
      .from("payment_links")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentLink) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.customerName !== undefined) updateData.customer_name = body.customerName;
    if (body.customerEmail !== undefined) updateData.customer_email = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customer_phone = body.customerPhone;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.expiresAt !== undefined) updateData.expires_at = body.expiresAt;

    // If marking as paid manually
    if (body.status === "paid" && !currentLink.paid_at) {
      updateData.paid_at = new Date().toISOString();
      updateData.paid_amount = body.paidAmount || currentLink.amount;
    }

    // If marking as unpaid (reverting from paid status)
    if (body.status === "active" && currentLink.status === "paid") {
      if (!body.changedBy || !body.changeReason) {
        return NextResponse.json({ 
          error: "changedBy and changeReason are required when marking as unpaid" 
        }, { status: 400 });
      }
      
      updateData.status_changed_by = body.changedBy;
      updateData.status_change_reason = body.changeReason;
      updateData.status_changed_at = new Date().toISOString();
      updateData.paid_at = null;
      updateData.paid_amount = null;
    }

    const { data: paymentLink, error: updateError } = await supabase
      .from("payment_links")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update payment link error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentLink });
  } catch (error) {
    console.error("Update payment link error:", error);
    return NextResponse.json({ error: "Failed to update payment link" }, { status: 500 });
  }
}

// DELETE: Deactivate payment link
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

    // Fetch current payment link
    const { data: currentLink, error: fetchError } = await supabase
      .from("payment_links")
      .select("stripe_payment_link_id")
      .eq("id", id)
      .single();

    if (fetchError || !currentLink) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    // Deactivate Stripe payment link if exists
    if (currentLink.stripe_payment_link_id) {
      try {
        await stripe.paymentLinks.update(currentLink.stripe_payment_link_id, {
          active: false,
        });
      } catch (stripeError) {
        console.error("Failed to deactivate Stripe payment link:", stripeError);
        // Continue even if Stripe deactivation fails
      }
    }

    // Mark as cancelled in database
    const { error: updateError } = await supabase
      .from("payment_links")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) {
      console.error("Delete payment link error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment link error:", error);
    return NextResponse.json({ error: "Failed to delete payment link" }, { status: 500 });
  }
}
