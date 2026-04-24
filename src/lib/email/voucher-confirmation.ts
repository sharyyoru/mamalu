import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface VoucherEmailDetails {
  customerName: string;
  customerEmail: string;
  amount: number;
  voucherCode: string;
}

export async function sendVoucherConfirmationEmail(details: VoucherEmailDetails): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend not configured");
    return { success: false, error: "Email service not configured" };
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Mamalu Kitchen <noreply@mamalu.ae>",
    to: details.customerEmail,
    subject: `Your Mamalu Kitchen Gift Card – AED ${details.amount.toFixed(2)}`,
    html: generateEmailHtml(details),
  });

  if (error) {
    console.error("Voucher email error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

function generateEmailHtml({ customerName, amount, voucherCode }: VoucherEmailDetails): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#fafaf9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="background-color:#ff7f5c;padding:30px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;">Mamalu Kitchen</h1>
        <p style="color:#ffffff;margin:10px 0 0;font-size:14px;">Gift Card</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;text-align:center;background-color:#fff5eb;">
        <p style="color:#78716c;margin:0 0 8px;font-size:14px;">Hi ${customerName}, your gift card is ready! 🎁</p>
        <p style="color:#1c1917;font-size:40px;font-weight:bold;margin:0;">AED ${amount.toFixed(2)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;text-align:center;">
        <p style="color:#78716c;margin:0 0 16px;font-size:14px;">Use this code at checkout:</p>
        <div style="display:inline-block;background-color:#1c1917;border-radius:12px;padding:18px 32px;">
          <span style="color:#ff7f5c;font-size:28px;font-weight:bold;letter-spacing:6px;font-family:monospace;">${voucherCode}</span>
        </div>
        <p style="color:#a8a29e;margin:20px 0 0;font-size:12px;">This code never expires and can be used on any Mamalu Kitchen experience.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 30px 30px;background-color:#f5f5f4;">
        <p style="color:#57534e;margin:0;font-size:13px;line-height:1.6;">
          To redeem, simply enter the code above when booking a class, rental, or any other Mamalu Kitchen service.<br>
          Questions? Contact us at <a href="mailto:hello@mamalukitchen.com" style="color:#ff7f5c;">hello@mamalukitchen.com</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 30px;text-align:center;background-color:#1c1917;">
        <p style="color:#78716c;margin:0;font-size:12px;">© ${new Date().getFullYear()} Mamalu Kitchen. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
