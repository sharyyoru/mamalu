import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, successUrl, cancelUrl } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
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

    if (booking.paid_at) {
      return NextResponse.json(
        { error: "Booking already paid" },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app";
    const finalSuccessUrl = successUrl || `${siteUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/booking/cancelled?booking_id=${bookingId}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: booking.attendee_email,
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: booking.class_title,
              description: `${booking.sessions_booked} session(s) - ${booking.payment_type === "full" ? "Full Course" : "Per Session"}`,
            },
            unit_amount: Math.round(booking.total_amount * 100), // Convert to fils
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        booking_number: booking.booking_number,
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });

    // Update booking with checkout session ID
    await supabase
      .from("class_bookings")
      .update({
        stripe_checkout_session_id: session.id,
        payment_method: "stripe",
      })
      .eq("id", bookingId);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
