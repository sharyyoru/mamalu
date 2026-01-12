import { Resend } from "resend";
import { generateBookingQRCode } from "@/lib/qrcode/generate";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface GuestQR {
  guestNumber: number;
  guestName?: string;
  qrToken: string;
}

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
  numberOfGuests: number;
  qrToken: string; // Main booking QR (for single guest)
  guestQRs?: GuestQR[]; // Individual guest QRs (for multiple guests)
}

/**
 * Send booking confirmation email with QR code(s)
 * For multiple guests, generates individual QR codes for each guest
 */
export async function sendBookingConfirmationEmail(booking: BookingDetails): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const numberOfGuests = booking.numberOfGuests || 1;
    const attachments: Array<{ filename: string; content: string; contentType: string }> = [];
    const qrCodeDataUrls: Array<{ guestNumber: number; guestName: string; dataUrl: string }> = [];

    if (numberOfGuests > 1 && booking.guestQRs && booking.guestQRs.length > 0) {
      // Generate QR codes for each guest
      for (const guest of booking.guestQRs) {
        const qrDataUrl = await generateBookingQRCode(guest.qrToken);
        const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        
        qrCodeDataUrls.push({
          guestNumber: guest.guestNumber,
          guestName: guest.guestName || `Guest ${guest.guestNumber}`,
          dataUrl: qrDataUrl,
        });

        attachments.push({
          filename: `guest-${guest.guestNumber}-qr-${booking.bookingNumber}.png`,
          content: qrBase64,
          contentType: "image/png",
        });
      }
    } else {
      // Single guest - use main booking QR
      const qrCodeDataUrl = await generateBookingQRCode(booking.qrToken);
      const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      
      qrCodeDataUrls.push({
        guestNumber: 1,
        guestName: booking.attendeeName,
        dataUrl: qrCodeDataUrl,
      });

      attachments.push({
        filename: `booking-qr-${booking.bookingNumber}.png`,
        content: qrCodeBase64,
        contentType: "image/png",
      });
    }

    const emailHtml = generateEmailHtml(booking, qrCodeDataUrls);

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Mamalu Kitchen <noreply@mamalu.ae>",
      to: booking.attendeeEmail,
      subject: `Booking Confirmed - ${booking.classTitle} | Mamalu Kitchen`,
      html: emailHtml,
      attachments,
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

interface QRCodeInfo {
  guestNumber: number;
  guestName: string;
  dataUrl: string;
}

function generateEmailHtml(booking: BookingDetails, qrCodes: QRCodeInfo[]): string {
  const numberOfGuests = booking.numberOfGuests || 1;
  const isMultipleGuests = qrCodes.length > 1;

  const qrCodesHtml = qrCodes.map((qr, index) => `
    <div style="background-color: #ffffff; padding: 15px; display: inline-block; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 10px; vertical-align: top;">
      <p style="color: #1c1917; font-weight: 600; margin: 0 0 10px 0; font-size: 14px;">${qr.guestName}</p>
      <img src="${qr.dataUrl}" alt="Check-in QR Code for ${qr.guestName}" style="width: 150px; height: 150px; display: block;" />
      <p style="color: #78716c; margin: 10px 0 0 0; font-size: 11px;">Guest ${qr.guestNumber} of ${qrCodes.length}</p>
    </div>
  `).join("");

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
            <td style="color: #78716c;">Number of Guests:</td>
            <td style="color: #1c1917; font-weight: 600;">${numberOfGuests}</td>
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
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">
          ${isMultipleGuests ? `Check-In QR Codes (${qrCodes.length} Guests)` : "Your Check-In QR Code"}
        </h3>
        <p style="color: #a16207; margin: 0 0 20px 0; font-size: 14px;">
          ${isMultipleGuests 
            ? "Each guest must present their own QR code for entry" 
            : "Present this QR code when you arrive for quick check-in"}
        </p>
        <div style="text-align: center;">
          ${qrCodesHtml}
        </div>
        <p style="color: #78716c; margin: 15px 0 0 0; font-size: 12px;">
          QR codes are also attached to this email for offline access
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
