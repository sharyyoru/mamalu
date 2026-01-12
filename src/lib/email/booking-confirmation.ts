import { Resend } from "resend";
import { generateBookingQRCode } from "@/lib/qrcode/generate";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface BookingDetails {
  bookingNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  classTitle: string;
  classDate: string;
  classTime: string;
  location: string;
  sessionsBooked: number;
  totalAmount: number;
  qrToken: string;
}

/**
 * Send booking confirmation email with QR code
 */
export async function sendBookingConfirmationEmail(booking: BookingDetails): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email service not configured" };
  }

  try {
    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await generateBookingQRCode(booking.qrToken);
    
    // Extract base64 data from data URL
    const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

    const emailHtml = generateEmailHtml(booking, qrCodeDataUrl);

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Mamalu Kitchen <noreply@mamalu.ae>",
      to: booking.attendeeEmail,
      subject: `Booking Confirmed - ${booking.classTitle} | Mamalu Kitchen`,
      html: emailHtml,
      attachments: [
        {
          filename: `booking-qr-${booking.bookingNumber}.png`,
          content: qrCodeBase64,
          contentType: "image/png",
        },
      ],
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send email";
    console.error("Send confirmation email error:", err);
    return { success: false, error: errorMessage };
  }
}

function generateEmailHtml(booking: BookingDetails, qrCodeDataUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fafaf9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #ff8c6b; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Mamalu Kitchen</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Authentic Home-Cooked Flavors</p>
      </td>
    </tr>
    
    <!-- Success Banner -->
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #f0fdf4;">
        <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 30px;">✓</span>
        </div>
        <h2 style="color: #166534; margin: 0 0 10px 0; font-size: 24px;">Booking Confirmed!</h2>
        <p style="color: #15803d; margin: 0; font-size: 16px;">Your payment has been received successfully.</p>
      </td>
    </tr>
    
    <!-- Booking Details -->
    <tr>
      <td style="padding: 30px;">
        <h3 style="color: #1c1917; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #ff8c6b; padding-bottom: 10px;">Booking Details</h3>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="font-size: 14px;">
          <tr>
            <td style="color: #78716c; width: 140px;">Booking Number:</td>
            <td style="color: #1c1917; font-weight: 600;">${booking.bookingNumber}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Name:</td>
            <td style="color: #1c1917;">${booking.attendeeName}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Class:</td>
            <td style="color: #1c1917; font-weight: 600;">${booking.classTitle}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Date:</td>
            <td style="color: #1c1917;">${booking.classDate}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Time:</td>
            <td style="color: #1c1917;">${booking.classTime}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Location:</td>
            <td style="color: #1c1917;">${booking.location}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Sessions:</td>
            <td style="color: #1c1917;">${booking.sessionsBooked}</td>
          </tr>
          <tr>
            <td style="color: #78716c;">Amount Paid:</td>
            <td style="color: #22c55e; font-weight: 600;">AED ${booking.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- QR Code Section -->
    <tr>
      <td style="padding: 20px 30px 30px; text-align: center; background-color: #fef3c7;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Your Check-In QR Code</h3>
        <p style="color: #a16207; margin: 0 0 20px 0; font-size: 14px;">
          Present this QR code when you arrive for quick check-in
        </p>
        <div style="background-color: #ffffff; padding: 20px; display: inline-block; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="width: 200px; height: 200px; display: block;" />
        </div>
        <p style="color: #78716c; margin: 15px 0 0 0; font-size: 12px;">
          QR code is also attached to this email for offline access
        </p>
      </td>
    </tr>
    
    <!-- Important Notes -->
    <tr>
      <td style="padding: 30px; background-color: #f5f5f4;">
        <h3 style="color: #1c1917; margin: 0 0 15px 0; font-size: 16px;">📋 Important Information</h3>
        <ul style="color: #57534e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Please arrive 10-15 minutes before the class starts</li>
          <li>Bring your QR code (on phone or printed)</li>
          <li>Wear comfortable clothing suitable for cooking</li>
          <li>Notify us at least 24 hours in advance for cancellations</li>
        </ul>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #1c1917;">
        <p style="color: #a8a29e; margin: 0 0 10px 0; font-size: 14px;">
          Thank you for booking with Mamalu Kitchen!
        </p>
        <p style="color: #78716c; margin: 0; font-size: 12px;">
          Questions? Reply to this email or contact us at support@mamalu.ae
        </p>
        <p style="color: #57534e; margin: 20px 0 0 0; font-size: 11px;">
          © ${new Date().getFullYear()} Mamalu Kitchen. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
