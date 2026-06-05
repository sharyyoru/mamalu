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
    const serviceBookingId = searchParams.get("serviceBookingId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const selectWithRelations = `
      *,
      service_booking:service_booking_id(
        id, booking_number, service_name, service_type,
        customer_name, event_date, event_time, guest_count,
        payment_status, paid_at, is_deposit_payment, deposit_amount, total_amount,
        deposit_paid, balance_paid
      ),
      class_booking:booking_id(
        id, booking_number, class_title, attendee_name,
        class_date, class_time, start_date, number_of_guests
      ),
      voucher_purchase:voucher_purchase_id(
        id, amount, voucher_code, status
      ),
      product_order:product_order_id(
        id, order_number, items, shipping_cost, total_amount
      ),
      payment_link:payment_link_id(
        id, link_code, title, stripe_payment_link_url
      ),
      creator:created_by(
        id, full_name, email
      )
    `;

    // Supabase's fluent query builder has route-specific generics here; keep this
    // local so we can reuse the same filter chain for the relationship fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (baseQuery: any) => {
      let filteredQuery = baseQuery;

      if (status && status !== "all") {
        filteredQuery = filteredQuery.eq("status", status);
      }

      if (startDate) {
        filteredQuery = filteredQuery.gte("created_at", `${startDate}T00:00:00`);
      }

      if (endDate) {
        filteredQuery = filteredQuery.lte("created_at", `${endDate}T23:59:59`);
      }

      if (serviceType && serviceType !== "all") {
        filteredQuery = filteredQuery.eq("service_type", serviceType);
      }

      if (serviceBookingId) {
        filteredQuery = filteredQuery.eq("service_booking_id", serviceBookingId);
      }

      return filteredQuery.range(offset, offset + limit - 1);
    };

    let query = applyFilters(supabase
      .from("invoices")
      .select(selectWithRelations, { count: "exact" })
      .order("created_at", { ascending: false }));

    let { data: invoices, error, count } = await query;

    if (error && error.code === "PGRST200") {
      console.warn(`Invoice relationship select unavailable; falling back to invoice rows only: ${error.message}`);
      query = applyFilters(supabase
        .from("invoices")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false }));

      const fallbackResult = await query;
      invoices = fallbackResult.data;
      error = fallbackResult.error;
      count = fallbackResult.count;
    }

    if (error) {
      console.error("Fetch invoices error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const invoiceRowsWithPossibleServiceIds = (invoices || []) as Array<{
      id: string;
      invoice_number?: string | null;
      service_booking_id?: string | null;
      service_booking?: unknown;
    }>;
    const missingServiceBookingRelations = invoiceRowsWithPossibleServiceIds.filter(
      (invoice) => invoice.service_booking_id && !invoice.service_booking
    );

    if (missingServiceBookingRelations.length > 0) {
      const serviceBookingIds = [
        ...new Set(
          missingServiceBookingRelations
            .map((invoice) => invoice.service_booking_id)
            .filter((id): id is string => Boolean(id))
        ),
      ];

      const { data: serviceBookings, error: serviceBookingsError } = await supabase
        .from("service_bookings")
        .select(`
          id, booking_number, service_name, service_type,
          customer_name, event_date, event_time, guest_count,
          payment_status, paid_at, is_deposit_payment, deposit_amount, total_amount,
          deposit_paid, balance_paid
        `)
        .in("id", serviceBookingIds);

      if (serviceBookingsError) {
        console.warn(`Invoice service booking fallback lookup failed: ${serviceBookingsError.message}`);
      } else {
        const serviceBookingMap = new Map((serviceBookings || []).map((booking) => [booking.id, booking]));
        invoices = ((invoices || []) as Array<{ service_booking_id?: string | null }>).map((invoice) => {
          const invoiceWithServiceId = invoice;
          if (!invoiceWithServiceId.service_booking_id) return invoice;

          return {
            ...invoice,
            service_booking: serviceBookingMap.get(invoiceWithServiceId.service_booking_id) || null,
          };
        });
      }
    }

    const invoiceRowsMissingServiceBooking = (invoices || []) as Array<{
      id: string;
      invoice_number?: string | null;
      service_booking_id?: string | null;
      service_booking?: unknown;
    }>;
    const missingServiceBookingLinks = invoiceRowsMissingServiceBooking.filter(
      (invoice) => !invoice.service_booking_id && !invoice.service_booking
    );

    if (missingServiceBookingLinks.length > 0) {
      const invoiceIds = missingServiceBookingLinks.map((invoice) => invoice.id);
      const invoiceNumbers = missingServiceBookingLinks
        .map((invoice) => invoice.invoice_number)
        .filter((invoiceNumber): invoiceNumber is string => Boolean(invoiceNumber));

      const serviceBookingSelect = `
        id, booking_number, invoice_id, invoice_number, service_name, service_type,
        customer_name, event_date, event_time, guest_count,
        payment_status, paid_at, is_deposit_payment, deposit_amount, total_amount,
        deposit_paid, balance_paid
      `;

      const lookupResults = await Promise.all([
        invoiceIds.length > 0
          ? supabase.from("service_bookings").select(serviceBookingSelect).in("invoice_id", invoiceIds)
          : Promise.resolve({ data: [], error: null }),
        invoiceNumbers.length > 0
          ? supabase.from("service_bookings").select(serviceBookingSelect).in("invoice_number", invoiceNumbers)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const serviceBookings = lookupResults.flatMap(({ data, error: lookupError }) => {
        if (lookupError) {
          console.warn(`Invoice reverse service booking lookup failed: ${lookupError.message}`);
          return [];
        }

        return data || [];
      });

      if (serviceBookings.length > 0) {
        const serviceBookingByInvoiceId = new Map(
          serviceBookings
            .filter((booking) => booking.invoice_id)
            .map((booking) => [booking.invoice_id as string, booking])
        );
        const serviceBookingByInvoiceNumber = new Map(
          serviceBookings
            .filter((booking) => booking.invoice_number)
            .map((booking) => [booking.invoice_number as string, booking])
        );

        invoices = ((invoices || []) as Array<{
          id: string;
          invoice_number?: string | null;
          service_booking_id?: string | null;
          service_booking?: unknown;
        }>).map((invoice) => {
          if (invoice.service_booking_id || invoice.service_booking) return invoice;

          const serviceBooking =
            serviceBookingByInvoiceId.get(invoice.id) ||
            (invoice.invoice_number ? serviceBookingByInvoiceNumber.get(invoice.invoice_number) : null);

          if (!serviceBooking) return invoice;

          return {
            ...invoice,
            service_booking_id: serviceBooking.id,
            service_booking: serviceBooking,
          };
        });
      }
    }

    const rawInvoiceRows = (invoices || []) as Array<{
      id: string;
      service_booking_id?: string | null;
      status: string;
      amount: number | null;
      base_amount?: number | null;
      extras_amount?: number | null;
      description?: string | null;
      notes?: string | null;
      line_items?: Array<{ name?: string; quantity?: number; price?: number }> | null;
      paid_at?: string | null;
      service_booking?: {
        id?: string | null;
        service_name?: string | null;
        payment_status?: string | null;
        paid_at?: string | null;
        is_deposit_payment?: boolean | null;
        deposit_amount?: number | null;
        total_amount?: number | null;
        deposit_paid?: boolean | null;
        balance_paid?: boolean | null;
      } | null;
    }>;

    const now = new Date().toISOString();
    const invoicesToCorrectDepositAmount = rawInvoiceRows.filter((invoice) => {
      const booking = invoice.service_booking;
      const depositAmount = Number(booking?.deposit_amount || 0);
      const totalAmount = Number(booking?.total_amount || 0);
      const invoiceAmount = Number(invoice.amount || 0);
      const isBalanceInvoice =
        invoice.description?.toLowerCase().includes("balance payment") ||
        invoice.notes?.toLowerCase().includes("balance payment");

      return Boolean(
        booking?.is_deposit_payment &&
        !isBalanceInvoice &&
        depositAmount > 0 &&
        totalAmount > depositAmount &&
        Math.abs(invoiceAmount - depositAmount) > 0.009
      );
    });

    if (invoicesToCorrectDepositAmount.length > 0) {
      const depositAmountUpdates = invoicesToCorrectDepositAmount.map((invoice) => {
        const depositAmount = Number(invoice.service_booking?.deposit_amount || 0);
        const description = invoice.description?.includes("50% Deposit")
          ? invoice.description
          : `${invoice.description || invoice.service_booking?.service_name || "Service Booking"} - 50% Deposit`;

        return supabase
          .from("invoices")
          .update({
            amount: depositAmount,
            base_amount: depositAmount,
            extras_amount: 0,
            description,
            line_items: [
              {
                name: description,
                quantity: 1,
                price: depositAmount,
              },
            ],
          })
          .eq("id", invoice.id);
      });

      const updateResults = await Promise.all(depositAmountUpdates);
      updateResults.forEach(({ error: updateError }) => {
        if (updateError) {
          console.warn(`Invoice deposit amount reconciliation failed: ${updateError.message}`);
        }
      });
    }

    const invoicesToMarkPaid = rawInvoiceRows.filter((invoice) => {
      const booking = invoice.service_booking;
      const isBalanceInvoice =
        invoice.description?.toLowerCase().includes("balance payment") ||
        invoice.notes?.toLowerCase().includes("balance payment");
      const bookingIsPaid =
        booking?.payment_status === "paid" ||
        Boolean(booking?.paid_at) ||
        Boolean(booking?.is_deposit_payment && booking?.deposit_paid && booking?.balance_paid) ||
        Boolean(booking?.is_deposit_payment && booking?.deposit_paid && !isBalanceInvoice);

      return invoice.status !== "paid" && bookingIsPaid;
    });

    if (invoicesToMarkPaid.length > 0) {
      const paidUpdates = invoicesToMarkPaid.map((invoice) =>
        supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: invoice.paid_at || invoice.service_booking?.paid_at || now,
            service_booking_id: invoice.service_booking_id || invoice.service_booking?.id || null,
          })
          .eq("id", invoice.id)
      );
      const updateResults = await Promise.all(paidUpdates);
      updateResults.forEach(({ error: updateError }) => {
        if (updateError) {
          console.warn(`Invoice status reconciliation failed: ${updateError.message}`);
        }
      });
    }

    const invoiceRows = rawInvoiceRows.map((invoice) => {
      const booking = invoice.service_booking;
      const bookingIsPaid =
        booking?.payment_status === "paid" ||
        Boolean(booking?.paid_at) ||
        Boolean(booking?.is_deposit_payment && booking?.deposit_paid && booking?.balance_paid) ||
        Boolean(
          booking?.is_deposit_payment &&
          booking?.deposit_paid &&
          !invoice.description?.toLowerCase().includes("balance payment") &&
          !invoice.notes?.toLowerCase().includes("balance payment")
        );
      const depositAmount = Number(booking?.deposit_amount || 0);
      const invoiceAmount = Number(invoice.amount || 0);
      const description = invoice.description?.includes("50% Deposit")
        ? invoice.description
        : `${invoice.description || booking?.service_name || "Service Booking"} - 50% Deposit`;
      const shouldCorrectDepositAmount = Boolean(
        booking?.is_deposit_payment &&
        !invoice.description?.toLowerCase().includes("balance payment") &&
        !invoice.notes?.toLowerCase().includes("balance payment") &&
        depositAmount > 0 &&
        Math.abs(invoiceAmount - depositAmount) > 0.009
      );

      const correctedInvoice = shouldCorrectDepositAmount
        ? {
            ...invoice,
            amount: depositAmount,
            base_amount: depositAmount,
            extras_amount: 0,
            description,
            line_items: [
              {
                name: description,
                quantity: 1,
                price: depositAmount,
              },
            ],
          }
        : invoice;

      if (invoice.status !== "paid" && bookingIsPaid) {
        return {
          ...correctedInvoice,
          status: "paid",
          paid_at: invoice.paid_at || booking?.paid_at || now,
        };
      }

      return correctedInvoice;
    });

    invoices = invoiceRows;

    // Calculate stats
    const stats = {
      total: count || 0,
      draft: invoiceRows.filter((i) => i.status === "draft").length,
      pending: invoiceRows.filter((i) => i.status === "pending").length,
      sent: invoiceRows.filter((i) => i.status === "sent").length,
      paid: invoiceRows.filter((i) => i.status === "paid").length,
      cancelled: invoiceRows.filter((i) => i.status === "cancelled").length,
      totalAmount: invoiceRows.reduce((sum, i) => sum + (i.amount || 0), 0),
      paidAmount: invoiceRows
        .filter((i) => i.status === "paid")
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app";
    
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
    const invoiceData: Record<string, unknown> = {
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
