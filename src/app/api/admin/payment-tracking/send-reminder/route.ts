import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.balance_payment_link) {
      return NextResponse.json({ error: "Payment link not generated yet" }, { status: 400 });
    }

    // Format event date
    const eventDateStr = booking.event_date 
      ? new Date(booking.event_date).toLocaleDateString("en-GB", { 
          weekday: "long", 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        })
      : "your scheduled date";

    // Send reminder email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { width: 120px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .amount { font-size: 28px; font-weight: bold; color: #1a1a1a; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #1a1a1a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
          .button-container { text-align: center; margin: 30px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://mamalu.vercel.app/graphics/mamalu-logo.avif" alt="Mamalu Kitchen" class="logo" />
          </div>
          
          <div class="content">
            <h2>Balance Payment Reminder</h2>
            <p>Dear ${booking.customer_name},</p>
            <p>This is a friendly reminder about the outstanding balance for your booking.</p>
            
            <div class="details">
              <p><strong>Booking:</strong> ${booking.booking_number}</p>
              <p><strong>Service:</strong> ${booking.service_name}${booking.menu_name ? ` - ${booking.menu_name}` : ""}</p>
              <p><strong>Event Date:</strong> ${eventDateStr}</p>
              <p><strong>Guests:</strong> ${booking.guest_count}</p>
            </div>
            
            <div class="amount">
              Balance Due: AED ${booking.balance_amount?.toLocaleString()}
            </div>
            
            <p>As per our booking policy, the balance payment is due 48 hours before your event. Please complete the payment using the link below:</p>
            
            <div class="button-container">
              <a href="${booking.balance_payment_link}" class="button">Pay Balance Now</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              <strong>Important:</strong> Final attendee numbers must be confirmed 48 hours prior to the event. 
              Any reduction after this point will still be charged. Goodie bag orders must be confirmed at least 5 days before the event.
            </p>
          </div>
          
          <div class="footer">
            <p>If you have any questions, please contact us at info@mamalukitchen.com</p>
            <p>Mamalu Kitchen | Dubai, UAE</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "Mamalu Kitchen <bookings@mamalukitchen.com>",
      to: booking.customer_email,
      subject: `Balance Payment Reminder - ${booking.booking_number}`,
      html: emailHtml,
    });

    // Update booking to mark reminder as sent
    await supabase
      .from("service_bookings")
      .update({ balance_reminder_sent: true })
      .eq("id", bookingId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Send reminder error:", error);
    return NextResponse.json({ error: error.message || "Failed to send reminder" }, { status: 500 });
  }
}
