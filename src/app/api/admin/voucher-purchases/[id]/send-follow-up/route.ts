import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { sendVoucherFollowUpEmail } from "@/lib/email/voucher-confirmation";
import { createAdminClient } from "@/lib/supabase/admin";
import { countAvailableVouchersForAmount } from "@/lib/vouchers/assign-purchase-voucher";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type VoucherPurchase = {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  stripe_session_id: string | null;
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: purchaseData, error: purchaseError } = await supabase
      .from("voucher_purchases")
      .select("id, customer_name, customer_email, amount, status, stripe_session_id")
      .eq("id", id)
      .single();

    const purchase = purchaseData as VoucherPurchase | null;

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: "Voucher purchase not found" }, { status: 404 });
    }

    if (purchase.status !== "pending") {
      return NextResponse.json({ error: "Follow-up emails can only be sent for pending purchases" }, { status: 400 });
    }

    if (!purchase.customer_email) {
      return NextResponse.json({ error: "Customer email is missing" }, { status: 400 });
    }

    const availableCount = await countAvailableVouchersForAmount(supabase, Number(purchase.amount));
    if (availableCount < 1) {
      return NextResponse.json({ error: "No available voucher remains for this amount" }, { status: 409 });
    }

    const checkoutUrl = await getCheckoutUrl(supabase, purchase);

    const { success, error } = await sendVoucherFollowUpEmail({
      customerName: purchase.customer_name,
      customerEmail: purchase.customer_email,
      amount: Number(purchase.amount),
      checkoutUrl,
    });

    if (!success) {
      return NextResponse.json({ error: error || "Failed to send follow-up email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Voucher follow-up error:", error);
    const message = error instanceof Error ? error.message : "Failed to send follow-up email";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function getCheckoutUrl(supabase: AdminClient, purchase: VoucherPurchase) {
  if (purchase.stripe_session_id) {
    const session = await stripe.checkout.sessions.retrieve(purchase.stripe_session_id);
    if (session.status === "complete") {
      throw new Error("Stripe checkout session is already complete");
    }
    if (session.status === "open" && session.url) {
      return session.url;
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: purchase.customer_email,
    line_items: [
      {
        price_data: {
          currency: "aed",
          product_data: {
            name: `Mamalu Kitchen Gift Card – AED ${Number(purchase.amount)}`,
            description: "Redeemable on any Mamalu Kitchen experience",
          },
          unit_amount: Math.round(Number(purchase.amount) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "voucher_purchase",
      customer_name: purchase.customer_name,
      customer_email: purchase.customer_email,
      amount: String(purchase.amount),
    },
    success_url: `${siteUrl}/vouchers/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/vouchers`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  const { error } = await supabase
    .from("voucher_purchases")
    .update({
      stripe_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);

  if (error) throw error;

  return session.url;
}
