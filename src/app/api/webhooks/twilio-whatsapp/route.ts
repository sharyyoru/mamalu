import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Twilio from "twilio";

const authToken = process.env.TWILIO_AUTH_TOKEN;

/**
 * POST: Receive incoming WhatsApp messages from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract message data from Twilio webhook
    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string; // Format: whatsapp:+1234567890
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");
    const profileName = formData.get("ProfileName") as string;

    // Validate Twilio signature if auth token is set
    if (authToken) {
      const twilioSignature = request.headers.get("x-twilio-signature");
      const url = request.url;
      
      // Convert FormData to object for validation
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value as string;
      });

      const isValid = Twilio.validateRequest(
        authToken,
        twilioSignature || "",
        url,
        params
      );

      if (!isValid) {
        console.error("Invalid Twilio signature");
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const supabase = createAdminClient();
    if (!supabase) {
      console.error("Database not configured");
      return new NextResponse("OK", { status: 200 });
    }

    // Extract phone number from WhatsApp format
    const fromNumber = from.replace("whatsapp:", "");
    const toNumber = to.replace("whatsapp:", "");

    // Find the WhatsApp account
    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("id")
      .eq("phone_number", toNumber)
      .single();

    if (!account) {
      console.log("No matching WhatsApp account found for:", toNumber);
      return new NextResponse("OK", { status: 200 });
    }

    // Store the message
    const { data: message, error: messageError } = await supabase
      .from("whatsapp_messages")
      .insert({
        account_id: account.id,
        message_sid: messageSid,
        from_number: fromNumber,
        to_number: toNumber,
        message_text: body || "",
        contact_name: profileName || null,
        direction: "inbound",
        has_media: numMedia > 0,
        media_count: numMedia,
        status: "received",
      })
      .select()
      .single();

    if (messageError) {
      console.error("Failed to store message:", messageError);
    }

    // Check for flagged content (simple keyword check)
    if (message && body) {
      const flaggedKeywords = [
        "urgent", "help", "emergency", "complaint", "refund", "cancel",
        "angry", "disappointed", "terrible", "worst", "scam", "fraud"
      ];
      
      const lowerBody = body.toLowerCase();
      const matchedKeywords = flaggedKeywords.filter(kw => lowerBody.includes(kw));

      if (matchedKeywords.length > 0) {
        await supabase.from("flagged_messages").insert({
          account_id: account.id,
          message_id: message.id,
          message_text: body,
          from_number: fromNumber,
          contact_name: profileName || null,
          flag_type: "keyword_match",
          flag_reason: `Matched keywords: ${matchedKeywords.join(", ")}`,
          confidence_score: Math.min(matchedKeywords.length * 0.3, 1.0),
          review_status: "pending",
        });
      }
    }

    // Return empty TwiML response (no auto-reply)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
