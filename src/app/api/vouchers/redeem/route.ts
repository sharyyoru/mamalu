import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVoucherRedemptionConfirmation } from "@/lib/email/voucher-redemption-confirmation";

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

    // First check if voucher exists at all (without is_active filter)
    const { data: anyVoucher, error: anyError } = await supabase
      .from("vouchers")
      .select("id, code, discount_value, is_active")
      .eq("code", voucherCode.trim().toUpperCase())
      .single();

    console.log("Voucher lookup (any):", { anyVoucher, anyError });

    // Get the voucher and verify it's still valid
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id, code, discount_value, is_active")
      .eq("code", voucherCode.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    console.log("Voucher lookup (active):", { voucher, voucherError });

    if (voucherError || !voucher) {
      console.error("Voucher lookup error:", voucherError);
      return NextResponse.json(
        { error: anyVoucher && !anyVoucher.is_active 
          ? "This voucher has already been used" 
          : "Invalid or expired voucher code" },
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

    // Mark the voucher as used (deactivate it)
    const { error: updateError } = await supabase
      .from("vouchers")
      .update({
        is_active: false,
      })
      .eq("id", voucher.id);

    if (updateError) {
      console.error("Failed to update voucher:", updateError);
      return NextResponse.json(
        { error: "Failed to process redemption" },
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
  } catch (error: any) {
    console.error("Error redeeming voucher:", error);
    return NextResponse.json(
      { error: error.message || "Failed to redeem voucher" },
      { status: 500 }
    );
  }
}
