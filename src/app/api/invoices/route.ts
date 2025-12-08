import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

// GET: List all invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    let query = supabase
      .from("invoices")
      .select("*, booking:booking_id(id, booking_number, class_title, attendee_name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error("Fetch invoices error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices, total: count });
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
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      description,
      lineItems,
      dueDate,
      notes,
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
    const invoiceNumber = invoiceNumData || `INV-${Date.now()}`;

    // Create Stripe payment link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: description || `Invoice ${invoiceNumber}`,
              description: lineItems
                ? lineItems.map((item: { name: string; quantity: number; amount: number }) => 
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
        booking_id: bookingId || "",
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
    const invoiceData = {
      invoice_number: invoiceNumber,
      booking_id: bookingId || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      amount,
      currency: "AED",
      description: description || null,
      line_items: lineItems || null,
      status: sendImmediately ? "sent" : "draft",
      payment_link: paymentLink.url,
      due_date: dueDate || null,
      sent_at: sendImmediately ? new Date().toISOString() : null,
      notes: notes || null,
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

    // Update booking if linked
    if (bookingId) {
      await supabase
        .from("class_bookings")
        .update({
          invoice_number: invoiceNumber,
          invoice_url: paymentLink.url,
          payment_link: paymentLink.url,
          payment_link_created_at: new Date().toISOString(),
          payment_method: "invoice",
        })
        .eq("id", bookingId);
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
