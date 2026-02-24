import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

// Vercel Cron Job - runs daily at 9 AM UAE time (5 AM UTC)
// Sends balance payment reminders for birthday bookings 48-72 hours before event

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Calculate date range: 48-72 hours from now (send reminders 2-3 days before event)
    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    const maxDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now

    // Format dates for Supabase query
    const minDateStr = minDate.toISOString().split("T")[0];
    const maxDateStr = maxDate.toISOString().split("T")[0];

    // Find birthday bookings that:
    // 1. Have a balance amount > 0
    // 2. Have not paid the balance yet
    // 3. Have not received a reminder yet
    // 4. Have event date within 48-72 hours
    // 5. Have a balance payment link generated
    const { data: bookings, error: bookingsError } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("is_deposit_payment", true)
      .eq("balance_paid", false)
      .eq("balance_reminder_sent", false)
      .gt("balance_amount", 0)
      .not("balance_payment_link", "is", null)
      .gte("event_date", minDateStr)
      .lte("event_date", maxDateStr)
      .in("service_type", ["birthday_deck", "kids"]); // Only birthday bookings

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No reminders to send",
        checked: { minDate: minDateStr, maxDate: maxDateStr }
      });
    }

    const results: { bookingId: string; status: string; error?: string }[] = [];

    for (const booking of bookings) {
      try {
        // Format event date
        const eventDateStr = booking.event_date
          ? new Date(booking.event_date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
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
              .urgent { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://mamalu.vercel.app/graphics/mamalu-logo.avif" alt="Mamalu Kitchen" class="logo" />
              </div>
              
              <div class="content">
                <h2>⏰ Balance Payment Reminder</h2>
                <p>Dear ${booking.customer_name},</p>
                <p>This is a friendly reminder that your event is coming up soon and the balance payment is due.</p>
                
                <div class="urgent">
                  <strong>⚠️ Payment Required:</strong> As per our booking policy, the balance payment is due 48 hours before your event.
                </div>
                
                <div class="details">
                  <p><strong>Booking:</strong> ${booking.booking_number}</p>
                  <p><strong>Service:</strong> ${booking.service_name}${booking.menu_name ? ` - ${booking.menu_name}` : ""}</p>
                  <p><strong>Event Date:</strong> ${eventDateStr}</p>
                  <p><strong>Guests:</strong> ${booking.guest_count}</p>
                </div>
                
                <div class="amount">
                  Balance Due: AED ${booking.balance_amount?.toLocaleString()}
                </div>
                
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
          subject: `⏰ Balance Payment Reminder - ${booking.booking_number}`,
          html: emailHtml,
        });

        // Update booking to mark reminder as sent
        await supabase
          .from("service_bookings")
          .update({ 
            balance_reminder_sent: true,
            balance_reminder_sent_at: new Date().toISOString()
          })
          .eq("id", booking.id);

        results.push({ bookingId: booking.id, status: "sent" });
      } catch (emailError: any) {
        console.error(`Error sending reminder for booking ${booking.id}:`, emailError);
        results.push({ 
          bookingId: booking.id, 
          status: "failed", 
          error: emailError.message 
        });
      }
    }

    const sentCount = results.filter(r => r.status === "sent").length;
    const failedCount = results.filter(r => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings: ${sentCount} sent, ${failedCount} failed`,
      results,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: error.message || "Cron job failed" }, { status: 500 });
  }
}
