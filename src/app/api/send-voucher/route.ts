import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getEmailFrom } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendVoucherBody {
  sessionId: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  voucherCode: string;
  frontImageBase64: string;
  termsImageBase64: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c] ?? c),
  );
}

function buildEmailHtml(recipientName: string, amountFormatted: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 24px 20px;text-align:center;background:#FF8C6B;">
        <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">Mamalu Kitchen</p>
        <p style="margin:6px 0 0;color:#fff3ef;font-size:14px;">Your Gift Card is ready 🎁</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 24px 12px;text-align:center;">
        <p style="margin:0;font-size:16px;color:#333333;line-height:1.6;">
          Hi <strong>${escapeHtml(recipientName || "there")}</strong>,<br/>
          here is your <strong>${escapeHtml(amountFormatted)}</strong> Mamalu Kitchen gift card.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 24px;">
        <img src="cid:mamalu-voucher-front" alt="Mamalu Kitchen Gift Card – Front" width="592"
          style="width:100%;max-width:592px;display:block;border-radius:8px;border:1px solid #f0e8e0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:8px 24px 24px;">
        <img src="cid:mamalu-voucher-terms" alt="Mamalu Kitchen Gift Card – Terms" width="592"
          style="width:100%;max-width:592px;display:block;border-radius:8px;border:1px solid #f0e8e0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px;border-top:1px solid #eeeeee;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#666666;">
          Questions? <a href="mailto:hello@mamalukitchen.com" style="color:#FF8C6B;text-decoration:none;">hello@mamalukitchen.com</a>
          &nbsp;·&nbsp;
          <a href="https://wa.me/971527479512" style="color:#FF8C6B;text-decoration:none;">WhatsApp</a>
        </p>
        <p style="margin:0;font-size:11px;color:#999999;">© ${new Date().getFullYear()} Mamalu Kitchen. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body: SendVoucherBody = await req.json();
    const { sessionId, recipientName, recipientEmail, amount, voucherCode, frontImageBase64, termsImageBase64 } = body;

    if (!recipientEmail || !voucherCode || !frontImageBase64 || !termsImageBase64) {
      return NextResponse.json(
        { error: "recipientEmail, voucherCode, frontImageBase64, and termsImageBase64 are required" },
        { status: 400 },
      );
    }

    if (!resend) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const frontBuffer = Buffer.from(frontImageBase64, "base64");
    const termsBuffer = Buffer.from(termsImageBase64, "base64");
    const amountFormatted = amount ? `AED ${Number(amount).toFixed(2)}` : "Gift Card";

    const { error: sendError } = await resend.emails.send({
      from: getEmailFrom(),
      to: recipientEmail,
      subject: `Your Mamalu Kitchen Gift Card – ${amountFormatted}`,
      html: buildEmailHtml(recipientName, amountFormatted),
      attachments: [
        {
          content: frontBuffer,
          filename: "mamalu-gift-card.png",
          contentType: "image/png",
          contentId: "mamalu-voucher-front",
        },
        {
          content: termsBuffer,
          filename: "mamalu-gift-card-terms.png",
          contentType: "image/png",
          contentId: "mamalu-voucher-terms",
        },
      ],
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    // Optionally mark the canvas email as sent — field may not exist yet, so ignore errors
    if (sessionId) {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase
          .from("voucher_purchases")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("stripe_session_id", sessionId)
          .then(() => {}, () => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("send-voucher error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
