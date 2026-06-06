import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";
import { sendPaymentLinkCreatedEmail } from "@/lib/email/payment-link-created";

interface PaymentLinkExtra {
  name?: string;
  price: number;
  quantity?: number;
}

interface CreatedInvoice {
  id: string;
  [key: string]: unknown;
}

const optionalInvoiceColumns = new Set([
  "payment_link_id",
  "lead_id",
  "base_amount",
  "extras_amount",
  "service_name",
  "service_type",
  "event_date",
  "guest_count",
  "source_type",
]);

const getInvoiceCustomerName = (customerName: string | null | undefined, title: string) => {
  return customerName?.trim() || title;
};

const getInvoiceCustomerEmail = (customerEmail: string | null | undefined) => {
  return customerEmail?.trim() || "no-email@mamalukitchen.local";
};

const getMissingInvoiceColumn = (error: { message?: string }) => {
  const match = error.message?.match(/'([^']+)' column of 'invoices'/);
  return match?.[1] || null;
};

// GET: Fetch all payment links
export async function GET(request: NextRequest) {
  // Verify user has admin access
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("payment_links")
      .select(`
        *,
        creator:created_by(id, full_name, email),
        lead:lead_id(id, name, email, phone, company)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`link_code.ilike.%${search}%,title.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    const { data: paymentLinks, error, count } = await query;

    if (error) {
      console.error("Fetch payment links error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      paymentLinks: paymentLinks || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error("Get payment links error:", error);
    return NextResponse.json({ error: "Failed to fetch payment links" }, { status: 500 });
  }
}

// POST: Create a new payment link
export async function POST(request: NextRequest) {
  // Verify user has admin access
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const {
      title,
      description,
      amount,
      pricePerPerson,
      numberOfPeople = 1,
      extras = [],
      customerName,
      customerEmail,
      customerPhone,
      singleUse = true,
      maxUses,
      expiresAt,
      referenceType,
      referenceId,
      notes,
      createdBy = user.id,
      leadId,
    } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

    // Calculate extras total
    const extrasTotal = (extras as PaymentLinkExtra[]).reduce((sum: number, extra) => {
      return sum + (extra.price * (extra.quantity || 1));
    }, 0);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Generate link code first
    const { data: linkCodeData } = await supabase.rpc("generate_payment_link_code");
    const linkCode = linkCodeData || `PAY-${Date.now().toString(36).toUpperCase()}`;

    // First create a product in Stripe
    const product = await stripe.products.create({
      name: title,
      description: description || undefined,
      metadata: {
        type: "custom_payment_link",
        link_code: linkCode,
      },
    });

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: "aed",
    });

    // Create Stripe payment link with the price
    const stripePaymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: {
          custom_message: "Thank you for your payment! Your transaction has been completed successfully. A confirmation email with your QR codes will be sent shortly.",
        },
      },
      metadata: {
        type: "custom_payment_link",
        link_code: linkCode,
        title,
        customer_email: customerEmail || "",
        number_of_people: numberOfPeople.toString(),
      },
    });

    // Create payment link record
    const paymentLinkData = {
      link_code: linkCode,
      title,
      description: description || null,
      amount,
      price_per_person: pricePerPerson || amount,
      number_of_people: numberOfPeople,
      extras: extras || [],
      extras_total: extrasTotal,
      currency: "AED",
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      stripe_payment_link_id: stripePaymentLink.id,
      stripe_payment_link_url: stripePaymentLink.url,
      stripe_price_id: price.id,
      single_use: singleUse,
      max_uses: maxUses || null,
      expires_at: expiresAt || null,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      notes: notes || null,
      status: "active",
      created_by: createdBy || null,
      lead_id: leadId || null,
    };

    const { data: paymentLink, error: insertError } = await supabase
      .from("payment_links")
      .insert(paymentLinkData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert payment link error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { data: invoiceNumData } = await supabase.rpc("generate_invoice_number");
    const invoiceNumber = invoiceNumData || `INV-${new Date().getFullYear().toString().slice(-2)}-${Date.now().toString().slice(-5)}`;
    const baseAmount = amount - extrasTotal;
    const lineItems = [
      {
        name: title,
        quantity: 1,
        price: baseAmount > 0 ? baseAmount : amount,
      },
      ...(extras as PaymentLinkExtra[]).map((extra) => ({
        name: extra.name || "Extra",
        quantity: extra.quantity || 1,
        price: extra.price,
      })),
    ];

    const invoiceData: Record<string, unknown> = {
      invoice_number: invoiceNumber,
      payment_link_id: paymentLink.id,
      lead_id: leadId || null,
      customer_name: getInvoiceCustomerName(customerName, title),
      customer_email: getInvoiceCustomerEmail(customerEmail),
      customer_phone: customerPhone || null,
      amount,
      base_amount: baseAmount > 0 ? baseAmount : amount,
      extras_amount: extrasTotal,
      currency: "AED",
      description: description || title,
      line_items: lineItems,
      service_name: title,
      service_type: referenceType || "payment_link",
      guest_count: numberOfPeople,
      status: "sent",
      payment_method: "stripe",
      payment_link: stripePaymentLink.url,
      sent_at: new Date().toISOString(),
      notes: notes || null,
      created_by: createdBy || null,
      source_type: "payment_link",
    };

    let invoice: CreatedInvoice | null = null;
    let invoiceDataForInsert = { ...invoiceData };

    for (let attempt = 0; attempt <= optionalInvoiceColumns.size; attempt += 1) {
      const { data: insertedInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert(invoiceDataForInsert)
        .select()
        .single();

      if (!invoiceError) {
        invoice = insertedInvoice as CreatedInvoice;
        break;
      }

      const missingColumn = getMissingInvoiceColumn(invoiceError);
      if (
        missingColumn &&
        optionalInvoiceColumns.has(missingColumn) &&
        Object.prototype.hasOwnProperty.call(invoiceDataForInsert, missingColumn)
      ) {
        const retryInvoiceData = { ...invoiceDataForInsert };
        delete retryInvoiceData[missingColumn];
        invoiceDataForInsert = retryInvoiceData;
        console.warn(`Retrying payment link invoice insert without missing column: ${missingColumn}`);
        continue;
      }

      console.error("Insert payment link invoice error:", invoiceError);
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    if (!invoice) {
      console.error("Insert payment link invoice error: invoice was not created after schema fallback");
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }

    const { error: paymentLinkInvoiceError } = await supabase
      .from("payment_links")
      .update({ invoice_id: invoice.id })
      .eq("id", paymentLink.id);

    if (paymentLinkInvoiceError) {
      const missingPaymentLinkColumn = paymentLinkInvoiceError.message?.match(/'([^']+)' column of 'payment_links'/)?.[1];
      if (missingPaymentLinkColumn === "invoice_id") {
        console.warn("Payment link invoice created, but payment_links.invoice_id is missing in the schema cache");
      } else {
        console.error("Link payment link invoice error:", paymentLinkInvoiceError);
        return NextResponse.json({ error: paymentLinkInvoiceError.message }, { status: 500 });
      }
    }

    let emailSent = false;
    let emailError: string | null = null;
    const emailAddress = typeof customerEmail === "string" ? customerEmail.trim() : "";

    if (emailAddress) {
      const emailResult = await sendPaymentLinkCreatedEmail({
        customerName: getInvoiceCustomerName(customerName, title),
        customerEmail: emailAddress,
        title,
        amount,
        paymentUrl: stripePaymentLink.url,
        linkCode,
        invoiceNumber,
        description: description || null,
      });

      emailSent = emailResult.success;
      emailError = emailResult.error || null;

      if (!emailResult.success) {
        console.error(`Payment link email failed for ${emailAddress}: ${emailResult.error}`);
      }
    } else {
      emailError = "Customer email not provided";
      console.warn(`Payment link ${linkCode} created without customer email; skipping payment link email`);
    }

    return NextResponse.json({
      success: true,
      paymentLink: { ...paymentLink, invoice_id: invoice.id },
      invoice,
      emailSent,
      emailError,
      stripeUrl: stripePaymentLink.url,
    });
  } catch (error) {
    console.error("Create payment link error:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment link";
    return NextResponse.json({ 
      error: message
    }, { status: 500 });
  }
}
