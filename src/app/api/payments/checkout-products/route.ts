import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createSanityAdminClient } from "@/lib/sanity/admin";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

type SanityCheckoutProduct = {
  _id: string;
  title?: string;
  price?: number;
  inStock?: boolean;
  isActive?: boolean;
  stockQuantity?: number;
  imageUrl?: string;
};

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

    const cartItems = items as CartItem[];
    const productIds = cartItems.map((item) => item.id).filter(Boolean);

    if (productIds.length !== cartItems.length) {
      return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
    }

    const sanity = createSanityAdminClient();
    const products = await sanity.fetch<SanityCheckoutProduct[]>(
      `*[_type == "product" && _id in $ids] {
        _id,
        title,
        price,
        inStock,
        isActive,
        stockQuantity,
        "imageUrl": images[0].asset->url
      }`,
      { ids: productIds }
    );
    const productsById = new Map(products.map((product) => [product._id, product]));

    const validatedItems = cartItems.map((item) => {
      const product = productsById.get(item.id);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

      if (!product || product.isActive === false || product.inStock === false) {
        throw new Error(`${item.title || "A product"} is no longer available`);
      }

      if (typeof product.stockQuantity === "number" && product.stockQuantity < quantity) {
        throw new Error(`${product.title || item.title} only has ${product.stockQuantity} in stock`);
      }

      return {
        id: item.id,
        title: product.title || item.title,
        price: Number(product.price || 0),
        quantity,
        imageUrl: product.imageUrl || item.imageUrl,
      };
    });

    // Create line items for Stripe
    const lineItems = validatedItems.map((item) => ({
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
    const subtotal = validatedItems.reduce((sum: number, item) => sum + item.price * item.quantity, 0);
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
        items_count: validatedItems.length.toString(),
        items_json: JSON.stringify(validatedItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        }))),
        subtotal: subtotal.toString(),
        shipping_cost: shippingCost.toString(),
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      shipping_address_collection: {
        allowed_countries: ["AE"],
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
