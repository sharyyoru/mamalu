import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { sendBookingPaymentReminderEmail } from "@/lib/email/booking-payment-reminder";
import { createSourceInvoice } from "@/lib/invoices/source-invoices";
import { getSiteUrl } from "@/lib/url/site";
import { requireAuth } from "@/lib/auth/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ["staff", "admin", "super_admin", "accountant", "chef"]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const balanceAmount = Number(booking.balance_amount) || 0;
    if (
      !booking.is_deposit_payment ||
      !booking.deposit_paid ||
      booking.balance_paid ||
      balanceAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Balance payment reminder is not available for this booking" },
        { status: 400 }
      );
    }

    if (!booking.customer_email) {
      return NextResponse.json({ error: "Booking does not have a customer email" }, { status: 400 });
    }

    const productName = [booking.service_name, booking.package_name || booking.menu_name]
      .filter(Boolean)
      .join(" - ");
    const baseUrl = getSiteUrl(request);

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
      customer_email: booking.customer_email,
      metadata: {
        type: "service_booking_balance",
        booking_id: booking.id,
        booking_number: booking.booking_number,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
    }

    await supabase
      .from("service_bookings")
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq("id", booking.id);

    const productLabel = productName || "Service Booking";
    await createSourceInvoice(supabase, {
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
      status: "sent",
      paymentLink: checkoutSession.url,
      stripeCheckoutSessionId: checkoutSession.id,
      notes: `Balance payment for booking ${booking.booking_number}`,
      updateBookingReference: false,
    });

    const bookingTitle = [booking.service_name, booking.package_name || booking.menu_name]
      .filter(Boolean)
      .join(" - ");

    const emailResult = await sendBookingPaymentReminderEmail({
      bookingNumber: booking.booking_number,
      attendeeName: booking.customer_name || "there",
      attendeeEmail: booking.customer_email,
      classTitle: bookingTitle || "Mamalu Kitchen booking",
      totalAmount: balanceAmount,
      paymentUrl: checkoutSession.url,
      amountLabel: "Remaining Balance",
      introText: "the remaining balance for your booking is now due. You can complete the payment using the secure button below.",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send reminder email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send balance reminder error:", error);
    return NextResponse.json({ error: "Failed to send balance reminder" }, { status: 500 });
  }
}
