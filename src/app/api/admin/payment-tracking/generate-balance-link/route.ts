import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.deposit_paid) {
      return NextResponse.json({ error: "Deposit must be paid first" }, { status: 400 });
    }

    if (booking.balance_paid) {
      return NextResponse.json({ error: "Balance already paid" }, { status: 400 });
    }

    if (booking.balance_payment_link) {
      return NextResponse.json({ 
        success: true, 
        paymentLink: booking.balance_payment_link 
      });
    }

    // Create Stripe product for balance payment
    const productName = booking.menu_name 
      ? `${booking.service_name} - ${booking.menu_name} (Balance Payment)`
      : `${booking.service_name} (Balance Payment)`;

    const product = await stripe.products.create({
      name: productName,
      description: `Balance payment for booking ${booking.booking_number} - ${booking.guest_count} guests`,
      metadata: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        service_type: booking.service_type,
        payment_type: "balance",
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(booking.balance_amount * 100),
      currency: "aed",
    });

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        payment_type: "balance",
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app"}/booking/success?booking=${booking.booking_number}&payment=balance`,
        },
      },
    });

    // Calculate balance due date (48 hours before event)
    let balanceDueDate = null;
    if (booking.event_date) {
      const eventDate = new Date(booking.event_date);
      balanceDueDate = new Date(eventDate.getTime() - 48 * 60 * 60 * 1000);
    }

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from("service_bookings")
      .update({
        balance_payment_link: paymentLink.url,
        balance_stripe_session_id: paymentLink.id,
        balance_due_date: balanceDueDate?.toISOString().split("T")[0] || null,
        payment_status: "balance_pending",
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Update booking error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.url,
    });
  } catch (error: any) {
    console.error("Generate balance link error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate link" }, { status: 500 });
  }
}
