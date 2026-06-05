import { Resend } from "resend";
import { getEmailFrom } from "@/lib/email/config";
import { getPublicSiteUrl } from "@/lib/url/site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface PackageScheduleItem {
  name?: string | null;
  session?: number | null;
  packageName?: string | null;
  event_date: string;
  event_time: string;
  time_label?: string | null;
}

interface PackageScheduleAssignmentDetails {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  packageName?: string | null;
  items: PackageScheduleItem[];
}

export async function sendPackageScheduleAssignmentEmail(
  booking: PackageScheduleAssignmentDetails
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email service not configured" };
  }

  if (booking.items.length === 0) {
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: getEmailFrom(),
      to: booking.customerEmail,
      subject: `Your Mamalu Kitchen package schedule is confirmed - ${booking.bookingNumber}`,
      html: generateEmailHtml(booking),
    });

    if (error) {
      console.error("Package schedule assignment email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send email";
    console.error("Send package schedule assignment email error:", err);
    return { success: false, error: errorMessage };
  }
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateForEmail(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generateEmailHtml(booking: PackageScheduleAssignmentDetails): string {
  const baseUrl = getPublicSiteUrl();
  const packageLabel = [booking.serviceName, booking.packageName].filter(Boolean).join(" - ");
  const scheduleRows = booking.items.map((item, index) => {
    const itemLabel = [
      item.session ? `Menu ${item.session}` : `Menu ${index + 1}`,
      item.name,
    ].filter(Boolean).join(": ");

    return `
          <tr>
            <td style="color: #000000; font-weight: 600; padding: 14px 0; border-top: 1px solid #f5f5f5;">${escapeHtml(itemLabel || "Package Menu")}</td>
            <td style="color: #000000; padding: 14px 0; border-top: 1px solid #f5f5f5;">${escapeHtml(formatDateForEmail(item.event_date))}</td>
            <td style="color: #000000; padding: 14px 0; border-top: 1px solid #f5f5f5;">${escapeHtml(item.time_label || item.event_time)}</td>
          </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Package Schedule Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; background-color: #fff7f2;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 36px 30px 28px; text-align: center; background-color: #FF8C6B; border-bottom: 4px solid #ff7a54;">
        <img src="${baseUrl}/graphics/mamalu-logo-transparent.png" alt="Mamalu Kitchen" style="width: 180px; height: auto; margin: 0 auto; display: block;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 44px 30px 24px; text-align: center;">
        <h1 style="color: #1c1917; margin: 0 0 10px; font-size: 24px; font-weight: 600;">Package Schedule Confirmed</h1>
        <p style="color: #6b5f59; margin: 0; font-size: 15px;">Hi ${escapeHtml(booking.customerName)}, your Mamalu Kitchen package schedule has been assigned.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 30px 34px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; border-top: 2px solid #FF8C6B; border-bottom: 1px solid #f1d8cf;">
          <tr>
            <td style="color: #666666; width: 150px; padding: 12px 0;">Booking Number</td>
            <td style="color: #000000; font-weight: 600; padding: 12px 0;" colspan="2">${escapeHtml(booking.bookingNumber)}</td>
          </tr>
          <tr>
            <td style="color: #666666; padding: 12px 0; border-top: 1px solid #f5f5f5;">Experience</td>
            <td style="color: #000000; font-weight: 500; padding: 12px 0; border-top: 1px solid #f5f5f5;" colspan="2">${escapeHtml(packageLabel)}</td>
          </tr>
          ${scheduleRows}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #fff7f2; border-top: 1px solid #f1d8cf;">
        <p style="color: #6b5f59; margin: 0; font-size: 13px; line-height: 1.7;">Please arrive 10-15 minutes before your scheduled time. If you have questions, contact us at <a href="mailto:info@mamalukitchen.com" style="color: #FF8C6B; text-decoration: none;">info@mamalukitchen.com</a>.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
