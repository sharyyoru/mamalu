import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Get the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json({ 
        error: "Payment not completed",
        status: session.payment_status 
      }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Find the payment link by stripe_payment_link_id
    const stripePaymentLinkId = session.payment_link as string;
    
    if (stripePaymentLinkId) {
      const { data: paymentLink, error: fetchError } = await supabase
        .from("payment_links")
        .select("id, single_use, use_count, max_uses, status")
        .eq("stripe_payment_link_id", stripePaymentLinkId)
        .single();

      if (paymentLink && paymentLink.status === "active") {
        const newUseCount = (paymentLink.use_count || 0) + 1;
        const shouldDeactivate = paymentLink.single_use || 
          (paymentLink.max_uses && newUseCount >= paymentLink.max_uses);

        await supabase
          .from("payment_links")
          .update({
            status: shouldDeactivate ? "paid" : "active",
            paid_at: new Date().toISOString(),
            paid_amount: (session.amount_total || 0) / 100,
            use_count: newUseCount,
            customer_email: session.customer_email || undefined,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", paymentLink.id);

        return NextResponse.json({
          success: true,
          message: "Payment verified and recorded",
          paymentLink: {
            id: paymentLink.id,
            status: shouldDeactivate ? "paid" : "active",
          },
        });
      } else if (paymentLink) {
        return NextResponse.json({
          success: true,
          message: "Payment already recorded",
          paymentLink: {
            id: paymentLink.id,
            status: paymentLink.status,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified",
      session: {
        id: session.id,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency,
        customerEmail: session.customer_email,
      },
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to verify payment" 
    }, { status: 500 });
  }
}
