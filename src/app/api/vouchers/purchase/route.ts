import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { name, email, amount } = await request.json();

    if (!name || !email || !amount) {
      return NextResponse.json({ error: "name, email, and amount are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Database not configured");

    // Check at least one active voucher of this amount exists
    const { data: available } = await supabase
      .from("vouchers")
      .select("id")
      .eq("discount_value", amount)
      .eq("is_active", true)
      .limit(1);

    if (!available || available.length === 0) {
      return NextResponse.json({ error: "No gift cards available for this amount" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `Mamalu Kitchen Gift Card – AED ${amount}`,
              description: "Redeemable on any Mamalu Kitchen experience",
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "voucher_purchase",
        customer_name: name,
        customer_email: email,
        amount: String(amount),
      },
      success_url: `${siteUrl}/vouchers/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/vouchers`,
    });

    // Create a pending purchase record
    await supabase.from("voucher_purchases").insert({
      customer_name: name,
      customer_email: email,
      amount: Number(amount),
      stripe_session_id: session.id,
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Voucher purchase error:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout" }, { status: 500 });
  }
}
