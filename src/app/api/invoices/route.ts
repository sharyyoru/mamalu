import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

// GET: List all invoices with date range and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const serviceType = searchParams.get("serviceType");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    let query = supabase
      .from("invoices")
      .select(`
        *,
        service_booking:service_booking_id(
          id, booking_number, service_name, service_type,
          customer_name, event_date, event_time, guest_count
        ),
        payment_link:payment_link_id(
          id, link_code, title, stripe_payment_link_url
        ),
        creator:created_by(
          id, full_name, email
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    if (serviceType && serviceType !== "all") {
      query = query.eq("service_type", serviceType);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error("Fetch invoices error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      total: count || 0,
      draft: invoices?.filter((i) => i.status === "draft").length || 0,
      sent: invoices?.filter((i) => i.status === "sent").length || 0,
      paid: invoices?.filter((i) => i.status === "paid").length || 0,
      cancelled: invoices?.filter((i) => i.status === "cancelled").length || 0,
      totalAmount: invoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
      paidAmount: invoices
        ?.filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
    };

    return NextResponse.json({ invoices, total: count, stats });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST: Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Legacy field for backwards compatibility
      bookingId,
      // New service booking field
      serviceBookingId,
      paymentLinkId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      baseAmount,
      extrasAmount,
      description,
      lineItems,
      serviceName,
      serviceType,
      eventDate,
      guestCount,
      dueDate,
      notes,
      createdBy,
      sendImmediately,
    } = body;

    if (!customerName || !customerEmail || !amount) {
      return NextResponse.json(
        { error: "Customer name, email, and amount are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Generate invoice number
    const { data: invoiceNumData } = await supabase.rpc("generate_invoice_number");
    const invoiceNumber = invoiceNumData || `INV-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-5)}`;

    // Create Stripe payment link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: description || serviceName || `Invoice ${invoiceNumber}`,
              description: lineItems
                ? lineItems.map((item: { name: string; quantity: number; price: number }) => 
                    `${item.name} x${item.quantity}`
                  ).join(", ")
                : undefined,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_number: invoiceNumber,
        service_booking_id: serviceBookingId || "",
        payment_link_id: paymentLinkId || "",
        customer_email: customerEmail,
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${siteUrl}/payment/success?invoice=${invoiceNumber}`,
        },
      },
    });

    // Create invoice record
    const invoiceData: Record<string, any> = {
      invoice_number: invoiceNumber,
      booking_id: bookingId || null,
      service_booking_id: serviceBookingId || null,
      payment_link_id: paymentLinkId || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      amount,
      base_amount: baseAmount || null,
      extras_amount: extrasAmount || null,
      currency: "AED",
      description: description || null,
      line_items: lineItems || null,
      service_name: serviceName || null,
      service_type: serviceType || null,
      event_date: eventDate || null,
      guest_count: guestCount || null,
      status: sendImmediately ? "sent" : "draft",
      payment_link: paymentLink.url,
      due_date: dueDate || null,
      sent_at: sendImmediately ? new Date().toISOString() : null,
      notes: notes || null,
      created_by: createdBy || null,
    };

    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert invoice error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update service booking if linked
    if (serviceBookingId) {
      await supabase
        .from("service_bookings")
        .update({
          invoice_id: invoice.id,
          invoice_number: invoiceNumber,
        })
        .eq("id", serviceBookingId);
    }

    // Update payment link if linked
    if (paymentLinkId) {
      await supabase
        .from("payment_links")
        .update({
          invoice_id: invoice.id,
        })
        .eq("id", paymentLinkId);
    }

    return NextResponse.json({
      success: true,
      invoice,
      paymentLink: paymentLink.url,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
