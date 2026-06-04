import { NextRequest, NextResponse } from "next/server";
import { sendVoucherConfirmationEmail } from "@/lib/email/voucher-confirmation";
import { sendVoucherRedemptionConfirmation } from "@/lib/email/voucher-redemption-confirmation";
import { sendBookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import { sendServiceBookingConfirmationEmail } from "@/lib/email/service-booking-confirmation";

export async function POST(req: NextRequest) {
  try {
    const { type, email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let result;

    switch (type) {
      case "voucher":
        result = await sendVoucherConfirmationEmail({
          customerName: "Test Customer",
          customerEmail: email,
          amount: 250.00,
          voucherCode: "TESTCODE123",
        });
        break;

      case "redemption":
        result = await sendVoucherRedemptionConfirmation({
          customerName: "Test Customer",
          customerEmail: email,
          voucherCode: "TESTCODE123",
          experienceName: "Emirati Cooking Class",
          eventDate: "Saturday, May 10, 2026",
          timeSlot: "10:00 AM - 1:00 PM",
          numberOfGuests: 2,
          originalPrice: 250.00,
          specialRequests: "Vegetarian options preferred",
        });
        break;

      case "booking":
        result = await sendBookingConfirmationEmail({
          bookingNumber: "BK-2026-001",
          attendeeName: "Test Customer",
          attendeeEmail: email,
          classTitle: "Emirati Cooking Class",
          classDate: "Saturday, May 10, 2026",
          classTime: "10:00 AM - 1:00 PM",
          location: "Mamalu Kitchen, Depachika Food Hall, Nakheel Mall",
          sessionsBooked: 1,
          totalAmount: 250.00,
          numberOfGuests: 1,
          qrToken: "test-qr-token-123",
        });
        break;

      case "service-booking":
        result = await sendServiceBookingConfirmationEmail({
          bookingNumber: "SB-20260604-TEST01",
          customerName: "Test Customer",
          customerEmail: email,
          serviceName: "Mini Chef - Mommy & Me",
          packageName: "Tea Time",
          eventDate: "2026-06-10",
          eventTime: "11:00",
          guestCount: 1,
          totalAmount: 375.00,
          isDepositPayment: false,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type. Use 'voucher', 'redemption', 'booking', or 'service-booking'" },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test ${type} email sent to ${email}` 
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
