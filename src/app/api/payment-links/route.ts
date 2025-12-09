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
      .select("*")
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Create Stripe payment link
    const stripePaymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: title,
              description: description || undefined,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${siteUrl}/payment/success?link_id={CHECKOUT_SESSION_ID}`,
        },
      },
      metadata: {
        type: "custom_payment_link",
        title,
        customer_email: customerEmail || "",
      },
    });

    // Generate link code
    const { data: linkCodeData } = await supabase.rpc("generate_payment_link_code");
    const linkCode = linkCodeData || `PAY-${Date.now().toString(36).toUpperCase()}`;

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
      single_use: singleUse,
      max_uses: maxUses || null,
      expires_at: expiresAt || null,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      notes: notes || null,
      status: "active",
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
  } catch (error) {
    console.error("Create payment link error:", error);
    return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
  }
}
