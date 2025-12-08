import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Manual endpoint to verify Stripe payment status for a booking
export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If already paid, return success
    if (booking.paid_at) {
      return NextResponse.json({ 
        success: true, 
        message: "Already paid",
        booking 
      });
    }

    // Check if there's a Stripe checkout session
    if (booking.stripe_checkout_session_id) {
      const session = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);
      
      if (session.payment_status === "paid") {
        // Update booking as paid
        const { data: updatedBooking, error: updateError } = await supabase
          .from("class_bookings")
          .update({
            status: "confirmed",
            paid_at: new Date().toISOString(),
            amount_paid: booking.total_amount,
            amount_due: 0,
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", bookingId)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Record transaction
        await supabase.from("payment_transactions").insert({
          booking_id: bookingId,
          transaction_type: "payment",
          payment_method: "stripe",
          amount: booking.total_amount,
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
        });

        return NextResponse.json({ 
          success: true, 
          message: "Payment verified and booking confirmed",
          booking: updatedBooking 
        });
      }
    }

    // Check by payment intent if available
    if (booking.stripe_payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
      
      if (paymentIntent.status === "succeeded") {
        const { data: updatedBooking } = await supabase
          .from("class_bookings")
          .update({
            status: "confirmed",
            paid_at: new Date().toISOString(),
            amount_paid: booking.total_amount,
            amount_due: 0,
          })
          .eq("id", bookingId)
          .select()
          .single();

        return NextResponse.json({ 
          success: true, 
          message: "Payment verified",
          booking: updatedBooking 
        });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: "Payment not found or not completed",
      booking 
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
