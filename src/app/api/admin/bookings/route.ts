import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

// GET: Fetch all service bookings with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const serviceType = searchParams.get("service_type");
    const createdBy = searchParams.get("created_by");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch service bookings with creator info
    let query = supabase
      .from("service_bookings")
      .select(`
        *,
        creator:created_by(id, full_name, email),
        payment_link:payment_link_id(id, link_code, stripe_payment_link_url, status)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (paymentStatus && paymentStatus !== "all") {
      if (paymentStatus === "unpaid") {
        query = query.is("paid_at", null);
      } else {
        query = query.eq("payment_status", paymentStatus);
      }
    }

    if (serviceType && serviceType !== "all") {
      query = query.eq("service_type", serviceType);
    }

    if (createdBy && createdBy !== "all") {
      query = query.eq("created_by", createdBy);
    }

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats from all bookings
    const { data: allBookings } = await supabase
      .from("service_bookings")
      .select("status, payment_status, paid_at, total_amount, deposit_amount, deposit_paid, balance_paid, is_deposit_payment");

    const stats = {
      total: allBookings?.length || 0,
      confirmed: allBookings?.filter((b) => b.status === "confirmed").length || 0,
      pending: allBookings?.filter((b) => b.status === "pending").length || 0,
      completed: allBookings?.filter((b) => b.status === "completed").length || 0,
      cancelled: allBookings?.filter((b) => b.status === "cancelled").length || 0,
      // Payment stats
      fullyPaid: allBookings?.filter((b) => b.paid_at || (b.is_deposit_payment && b.deposit_paid && b.balance_paid)).length || 0,
      depositPending: allBookings?.filter((b) => b.is_deposit_payment && !b.deposit_paid).length || 0,
      balancePending: allBookings?.filter((b) => b.is_deposit_payment && b.deposit_paid && !b.balance_paid).length || 0,
      // Revenue
      totalRevenue: allBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
      collectedRevenue: allBookings?.reduce((sum, b) => {
        if (b.paid_at) return sum + (b.total_amount || 0);
        if (b.is_deposit_payment && b.deposit_paid) return sum + (b.deposit_amount || 0);
        return sum;
      }, 0) || 0,
    };

    // Get list of users who have created bookings for filter dropdown
    const { data: creators } = await supabase
      .from("service_bookings")
      .select("created_by")
      .not("created_by", "is", null);
    
    const uniqueCreatorIds = [...new Set(creators?.map(c => c.created_by).filter(Boolean))];
    
    let creatorsList: { id: string; full_name: string | null; email: string | null }[] = [];
    if (uniqueCreatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", uniqueCreatorIds);
      creatorsList = profiles || [];
    }

    return NextResponse.json({ bookings, stats, creators: creatorsList });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST: Create a new booking (admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      serviceId,
      serviceName,
      serviceType,
      packageId,
      packageName,
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
      extras,
      baseAmount,
      extrasAmount,
      totalAmount,
      isDepositPayment,
      depositAmount,
      balanceAmount,
      specialRequests,
      notes,
      createdBy,
      generatePaymentLink,
    } = body;

    if (!serviceName || !customerName || !customerEmail || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create booking record
    const bookingData = {
      service_id: serviceId || null,
      package_id: packageId || null,
      service_type: serviceType || null,
      service_name: serviceName,
      package_name: packageName || null,
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
      extras: extras || [],
      base_amount: baseAmount || totalAmount,
      extras_amount: extrasAmount || 0,
      total_amount: totalAmount,
      is_deposit_payment: isDepositPayment || false,
      deposit_amount: depositAmount || null,
      balance_amount: balanceAmount || null,
      deposit_paid: false,
      balance_paid: false,
      payment_status: isDepositPayment ? "deposit_pending" : "pending",
      special_requests: specialRequests || null,
      notes: notes || null,
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

    let paymentLinkData = null;

    // Generate payment link if requested
    if (generatePaymentLink) {
      const paymentAmount = isDepositPayment ? depositAmount : totalAmount;
      
      // Generate link code
      const { data: linkCodeData } = await supabase.rpc("generate_payment_link_code");
      const linkCode = linkCodeData || `PAY-${Date.now().toString(36).toUpperCase()}`;

      // Create Stripe product and payment link
      const productName = menuName 
        ? `${serviceName} - ${menuName}` 
        : (packageName ? `${serviceName} - ${packageName}` : serviceName);
      
      const productDescription = isDepositPayment
        ? `50% Deposit for ${guestCount} guest(s)${eventDate ? ` on ${eventDate}` : ""}`
        : `Booking for ${guestCount} guest(s)${eventDate ? ` on ${eventDate}` : ""}`;

      const product = await stripe.products.create({
        name: isDepositPayment ? `${productName} (50% Deposit)` : productName,
        description: productDescription,
        metadata: {
          booking_id: booking.id,
          booking_number: booking.booking_number,
          type: "service_booking",
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(paymentAmount * 100),
        currency: "aed",
      });

      const stripePaymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: {
          type: "hosted_confirmation",
          hosted_confirmation: {
            custom_message: "Thank you for your payment! Your booking has been confirmed.",
          },
        },
        metadata: {
          type: "service_booking",
          booking_id: booking.id,
          booking_number: booking.booking_number,
          link_code: linkCode,
        },
      });

      // Create payment link record
      const { data: paymentLink, error: plError } = await supabase
        .from("payment_links")
        .insert({
          link_code: linkCode,
          title: productName,
          description: productDescription,
          amount: paymentAmount,
          price_per_person: menuPrice || (totalAmount / guestCount),
          number_of_people: guestCount,
          extras: extras || [],
          extras_total: extrasAmount || 0,
          currency: "AED",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          stripe_payment_link_id: stripePaymentLink.id,
          stripe_payment_link_url: stripePaymentLink.url,
          stripe_price_id: price.id,
          single_use: true,
          reference_type: "service_booking",
          reference_id: booking.id,
          notes: notes || null,
          status: "active",
          created_by: createdBy || null,
        })
        .select()
        .single();

      if (!plError && paymentLink) {
        // Update booking with payment link reference
        await supabase
          .from("service_bookings")
          .update({ payment_link_id: paymentLink.id })
          .eq("id", booking.id);

        paymentLinkData = {
          ...paymentLink,
          stripeUrl: stripePaymentLink.url,
        };

        // Create invoice for the booking
        const { data: invoiceNumData } = await supabase.rpc("generate_invoice_number");
        const invoiceNumber = invoiceNumData || `INV-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-5)}`;

        const { data: invoice } = await supabase
          .from("invoices")
          .insert({
            invoice_number: invoiceNumber,
            service_booking_id: booking.id,
            payment_link_id: paymentLink.id,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone || null,
            amount: totalAmount,
            base_amount: baseAmount || totalAmount,
            extras_amount: extrasAmount || 0,
            currency: "AED",
            description: productName,
            line_items: extras || null,
            service_name: serviceName,
            service_type: serviceType,
            event_date: eventDate || null,
            guest_count: guestCount,
            status: "sent",
            payment_link: stripePaymentLink.url,
            sent_at: new Date().toISOString(),
            notes: notes || null,
            created_by: createdBy || null,
          })
          .select()
          .single();

        if (invoice) {
          // Update booking with invoice reference
          await supabase
            .from("service_bookings")
            .update({ 
              invoice_id: invoice.id,
              invoice_number: invoiceNumber,
            })
            .eq("id", booking.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking,
      paymentLink: paymentLinkData,
    });
  } catch (error: any) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
