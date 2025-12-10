import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch all payment links
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("payment_links")
      .select(`
        *,
        creator:created_by(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: paymentLinks, error } = await query;

    if (error) {
      console.error("Fetch payment links error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paymentLinks: paymentLinks || [] });
  } catch (error) {
    console.error("Get payment links error:", error);
    return NextResponse.json({ error: "Failed to fetch payment links" }, { status: 500 });
  }
}

// POST: Create a new payment link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      singleUse = true,
      maxUses,
      expiresAt,
      referenceType,
      referenceId,
      notes,
      createdBy,
    } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

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
          custom_message: "Thank you for your payment! Your transaction has been completed successfully. A receipt has been sent to your email.",
        },
      },
      metadata: {
        type: "custom_payment_link",
        link_code: linkCode,
        title,
        customer_email: customerEmail || "",
      },
    });

    // Create payment link record
    const paymentLinkData = {
      link_code: linkCode,
      title,
      description: description || null,
      amount,
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

    return NextResponse.json({
      success: true,
      paymentLink,
      stripeUrl: stripePaymentLink.url,
    });
  } catch (error: any) {
    console.error("Create payment link error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create payment link" 
    }, { status: 500 });
  }
}
