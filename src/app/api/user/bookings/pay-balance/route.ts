import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createSourceInvoice } from "@/lib/invoices/source-invoices";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email || "";
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: booking, error: bookingError } = await serviceClient
      .from("service_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const normalizedUserEmail = email.trim().toLowerCase();
    const normalizedBookingEmail = String(booking.customer_email || "").trim().toLowerCase();
    const ownsBooking =
      booking.user_id === user.id ||
      (normalizedUserEmail.length > 0 && normalizedBookingEmail === normalizedUserEmail);

    if (!ownsBooking) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const balanceAmount = Number(booking.balance_amount) || 0;
    if (
      !booking.is_deposit_payment ||
      !booking.deposit_paid ||
      booking.balance_paid ||
      balanceAmount <= 0
    ) {
      return NextResponse.json({ error: "Balance payment is not available for this booking" }, { status: 400 });
    }

    const productName = [booking.service_name, booking.package_name || booking.menu_name]
      .filter(Boolean)
      .join(" - ");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app";

    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `${productName || "Service Booking"} (Balance Payment)`,
              description: `Balance payment for booking ${booking.booking_number}`,
              metadata: {
                booking_id: booking.id,
                booking_number: booking.booking_number,
              },
            },
            unit_amount: Math.round(balanceAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/account/bookings?balance=paid&booking=${booking.booking_number}`,
      cancel_url: `${baseUrl}/account/bookings?balance=cancelled&booking=${booking.booking_number}`,
      customer_email: booking.customer_email || email || undefined,
      metadata: {
        type: "service_booking_balance",
        booking_id: booking.id,
        booking_number: booking.booking_number,
      },
    });

    await serviceClient
      .from("service_bookings")
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq("id", booking.id);

    const productLabel = productName || "Service Booking";
    await createSourceInvoice(serviceClient, {
      sourceType: "service_booking",
      serviceBookingId: booking.id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      amount: balanceAmount,
      baseAmount: balanceAmount,
      extrasAmount: 0,
      description: `${productLabel} - Balance Payment`,
      lineItems: [
        {
          name: `${productLabel} (Balance Payment)`,
          quantity: 1,
          price: balanceAmount,
        },
      ],
      serviceName: booking.service_name,
      serviceType: booking.service_type,
      eventDate: booking.event_date,
      guestCount: booking.guest_count,
      status: checkoutSession.url ? "sent" : "pending",
      paymentLink: checkoutSession.url,
      stripeCheckoutSessionId: checkoutSession.id,
      notes: `Balance payment for booking ${booking.booking_number}`,
      updateBookingReference: false,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Create balance checkout error:", error);
    return NextResponse.json({ error: "Failed to create balance checkout" }, { status: 500 });
  }
}
