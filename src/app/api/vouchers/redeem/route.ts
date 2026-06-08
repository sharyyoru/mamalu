import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVoucherRedemptionConfirmation } from "@/lib/email/voucher-redemption-confirmation";
import { consumeVoucherUse, getRedeemableVoucherByCode } from "@/lib/vouchers/voucher-usage";

export async function POST(request: NextRequest) {
  try {
    const { voucherCode, menuItemId, customerDetails } = await request.json();

    console.log("Redeem request:", { voucherCode, menuItemId, customerDetails });

    if (!voucherCode || !menuItemId) {
      return NextResponse.json(
        { error: "Voucher code and menu item are required" },
        { status: 400 }
      );
    }

    // Validate customer details
    if (!customerDetails?.name || !customerDetails?.email || !customerDetails?.eventDate || !customerDetails?.timeSlot) {
      return NextResponse.json(
        { error: "Please provide all required booking details" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    const { voucher, error: voucherError } = await getRedeemableVoucherByCode(supabase, voucherCode);
    if (!voucher) {
      return NextResponse.json(
        { error: voucherError || "Invalid or expired voucher code" },
        { status: 404 }
      );
    }

    // Get the menu item and verify price is within voucher value
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .eq("id", menuItemId)
      .eq("is_active", true)
      .single();

    if (menuError || !menuItem) {
      return NextResponse.json(
        { error: "Menu item not found or unavailable" },
        { status: 404 }
      );
    }

    // Verify menu item price is within voucher value
    if (Number(menuItem.price) > Number(voucher.discount_value)) {
      return NextResponse.json(
        { error: "Menu item price exceeds voucher value" },
        { status: 400 }
      );
    }

    // Try to create a redemption record (table may not exist yet)
    let redemptionId = null;
    try {
      const { data: redemption, error: redemptionError } = await supabase
        .from("voucher_redemptions")
        .insert({
          voucher_id: voucher.id,
          voucher_code: voucher.code,
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name,
          menu_item_price: menuItem.price,
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone || null,
          event_date: customerDetails.eventDate,
          time_slot: customerDetails.timeSlot,
          number_of_guests: customerDetails.numberOfGuests || 1,
          special_requests: customerDetails.specialRequests || null,
          status: 'pending',
          redeemed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (redemptionError) {
        console.error("Failed to create redemption record:", redemptionError);
      } else {
        redemptionId = redemption?.id;
      }
    } catch (e) {
      console.error("Failed to create redemption record (table may not exist):", e);
      // Continue anyway - we'll still mark the voucher as used
    }

    const consumeResult = await consumeVoucherUse(supabase, voucher.id);
    if (!consumeResult.success) {
      console.error("Failed to update voucher:", consumeResult.error);
      return NextResponse.json(
        { error: consumeResult.error || "Failed to process redemption" },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    console.log(`📧 Sending voucher redemption confirmation to ${customerDetails.email}`);
    const emailResult = await sendVoucherRedemptionConfirmation({
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      voucherCode: voucher.code,
      experienceName: menuItem.name,
      eventDate: customerDetails.eventDate,
      timeSlot: customerDetails.timeSlot,
      numberOfGuests: customerDetails.numberOfGuests || 1,
      originalPrice: Number(menuItem.price),
      specialRequests: customerDetails.specialRequests,
    });

    if (emailResult.success) {
      console.log("✅ Confirmation email sent successfully");
      
      // Update redemption record with email sent timestamp
      if (redemptionId) {
        await supabase
          .from("voucher_redemptions")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", redemptionId);
      }
    } else {
      console.error("❌ Failed to send confirmation email:", emailResult.error);
      // Don't fail the entire redemption if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Voucher redeemed successfully",
      redemption: {
        id: redemptionId,
        voucherCode: voucher.code,
        menuItem: menuItem.name,
        originalPrice: menuItem.price,
        amountSaved: menuItem.price,
        booking: {
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
          eventDate: customerDetails.eventDate,
          timeSlot: customerDetails.timeSlot,
          numberOfGuests: customerDetails.numberOfGuests || 1,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Error redeeming voucher:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to redeem voucher" },
      { status: 500 }
    );
  }
}
