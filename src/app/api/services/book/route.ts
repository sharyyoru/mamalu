import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      serviceId,
      packageId,
      serviceType,
      serviceName,
      packageName,
      // Corporate menu
      menuId,
      menuName,
      menuPrice,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      eventDate,
      eventTime,
      guestCount,
      items,
      extras,
      baseAmount,
      extrasAmount,
      totalAmount,
      // Split payment info
      isDepositPayment,
      depositAmount,
      balanceAmount,
      specialRequests,
      ageRange,
      waiverAccepted,
      userId,
      createdBy,
    } = body;

    if (!serviceName || !customerName || !customerEmail || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine payment amount (deposit for corporate, full for others)
    const paymentAmount = isDepositPayment ? depositAmount : totalAmount;
    const paymentStatus = isDepositPayment ? "deposit_pending" : "pending";

    // Create booking record
    const bookingData = {
      service_id: serviceId || null,
      package_id: packageId || null,
      service_type: serviceType,
      service_name: serviceName,
      package_name: packageName || null,
      // Corporate menu info
      menu_id: menuId || null,
      menu_name: menuName || null,
      menu_price: menuPrice || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      company_name: companyName || null,
      event_date: eventDate || null,
      event_time: eventTime || null,
      guest_count: guestCount || 1,
      items: items || [],
      extras: extras || [],
      base_amount: baseAmount || totalAmount,
      extras_amount: extrasAmount || 0,
      total_amount: totalAmount,
      // Split payment tracking
      is_deposit_payment: isDepositPayment || false,
      deposit_amount: depositAmount || null,
      balance_amount: balanceAmount || null,
      deposit_paid: false,
      balance_paid: false,
      payment_status: paymentStatus,
      special_requests: specialRequests || null,
      age_range: ageRange || null,
      waiver_accepted: waiverAccepted || false,
      user_id: userId || null,
      created_by: createdBy || null,
      status: "pending",
    };

    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error("Create booking error:", bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // Create Stripe checkout session
    const productName = menuName 
      ? `${serviceName} - ${menuName}` 
      : (packageName ? `${serviceName} - ${packageName}` : serviceName);
    
    const productDescription = isDepositPayment
      ? `50% Deposit for ${guestCount} guest(s)${eventDate ? ` on ${eventDate}` : ""} - Balance of AED ${balanceAmount} due 48 hours before event`
      : `Booking for ${guestCount} guest(s)${eventDate ? ` on ${eventDate}` : ""}`;

    const product = await stripe.products.create({
      name: isDepositPayment ? `${productName} (50% Deposit)` : productName,
      description: productDescription,
      metadata: {
        booking_id: booking.id,
        service_type: serviceType,
        booking_number: booking.booking_number,
        is_deposit: isDepositPayment ? "true" : "false",
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(paymentAmount * 100), // Use paymentAmount (deposit or full)
      currency: "aed",
    });

    // Always use production URL for Stripe redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app";
    
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "payment",
      success_url: `${baseUrl}/booking/success?booking=${booking.booking_number}`,
      cancel_url: `${baseUrl}/book?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        service_type: serviceType,
        type: "service_booking",
      },
    });

    // Update booking with Stripe session ID
    await supabase
      .from("service_bookings")
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq("id", booking.id);

    return NextResponse.json({
      success: true,
      booking,
      checkoutUrl: checkoutSession.url,
    });
  } catch (error: any) {
    console.error("Book service error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
