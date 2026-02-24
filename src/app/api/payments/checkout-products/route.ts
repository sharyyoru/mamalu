import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, successUrl, cancelUrl } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app";
    const finalSuccessUrl = successUrl || `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/cart`;

    // Create line items for Stripe
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: "aed",
        product_data: {
          name: item.title,
          ...(item.imageUrl && { images: [item.imageUrl] }),
        },
        unit_amount: Math.round(item.price * 100), // Convert to fils
      },
      quantity: item.quantity,
    }));

    // Calculate if free shipping applies (orders over 200 AED)
    const subtotal = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal > 200 ? 0 : 25;

    // Add shipping as a line item if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "aed",
          product_data: {
            name: "Shipping",
          },
          unit_amount: shippingCost * 100,
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      ...(customerEmail && { customer_email: customerEmail }),
      line_items: lineItems,
      metadata: {
        order_type: "product_purchase",
        items_count: items.length.toString(),
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      shipping_address_collection: {
        allowed_countries: ["AE"],
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
